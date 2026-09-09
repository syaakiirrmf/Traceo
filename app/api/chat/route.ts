import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { GoogleGenerativeAI, type Content } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { hasPermission } from '@/lib/auth/permissions'
import { rateLimitFailOpen, parseClientIp } from '@/lib/ratelimit'
import { toolDeclarations, SYSTEM_PROMPT, AI_ROLE_SCOPE } from '@/lib/ai/tools'
import { dispatchAiTool, type AiUserContext } from '@/lib/ai/functions'
import { cleanAiResponse, detectStructuredRequest } from '@/lib/ai/postProcess'
import type { UserRole } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_TOOL_ROUNDS = 4

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

function safeJson<T>(value: T): T {
  return value
}

const MAX_MESSAGE_CHARS = 4000
const MAX_BODY_BYTES = 128 * 1024 // 128KB — halang bil Gemini + DoS

function checkOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return true
  try {
    const o = new URL(origin)
    const host =
      request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? ''
    return o.host === host
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  if (!checkOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 })
  }

  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('id, peranan, status')
    .eq('auth_id', authUser.id)
    .single()
  if (!profile) {
    return NextResponse.json({ error: 'User profile not found' }, { status: 401 })
  }
  if (profile.status === 'tidak_aktif') {
    await supabase.auth.signOut()
    return NextResponse.json({ error: 'Account is disabled.' }, { status: 403 })
  }

  if (!hasPermission(profile.peranan, 'lihat_assistant')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ─── Rate limit: cap AI spend per user (Gemini is metered) ────────────────
  // Fail-OPEN + log bila Redis down (jangan 500kan chat), fail-CLOSED tidak
  // diperlukan di sini kerana auth + permission sudah disemak di atas.
  const ip = parseClientIp(
    request.headers.get('x-forwarded-for'),
    request.headers.get('x-real-ip')
  )
  const rl = await rateLimitFailOpen(`chat:${profile.id}`, 30, 60, 'chat')
  if (!rl.ok) {
    Sentry.captureMessage('chat_429', { level: 'warning', extra: { userId: profile.id, ip } })
    return NextResponse.json(
      {
        error: `Too many requests. Please wait ${rl.retryAfterSeconds}s before trying again.`,
      },
      { status: 429 }
    )
  }

  let body: { messages?: ChatMessage[]; sesiId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const messages = Array.isArray(body.messages)
    ? body.messages
        .filter((m) => m && (m.role === 'user' || m.role === 'assistant'))
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: typeof m.content === 'string' ? m.content.slice(0, MAX_MESSAGE_CHARS) : '',
        }))
        .filter((m) => m.content.length > 0)
        .slice(-12)
    : []

  // ─── Chat history persistence ─────────────────────────────────────────
  // Reuse the incoming session id when continuing a conversation; otherwise
  // create a fresh session titled from the first user message.
  const lastUserMessage =
    [...messages].reverse().find((m) => m.role === 'user')?.content ?? ''
  let sesiId = typeof body.sesiId === 'string' && body.sesiId ? body.sesiId : null

  if (sesiId) {
    const { data: owned } = await supabase
      .from('chat_sesi')
      .select('id')
      .eq('id', sesiId)
      .eq('user_id', profile.id)
      .maybeSingle()
    if (!owned) sesiId = null
  }

  if (!sesiId) {
    const tajuk = (lastUserMessage || 'New conversation').slice(0, 120)
    const { data: created, error: createError } = await supabase
      .from('chat_sesi')
      .insert({ user_id: profile.id, tajuk })
      .select('id')
      .single()
    if (createError) {
      console.error('[Chat session create]', createError)
    } else {
      sesiId = created.id
    }
  }

  if (sesiId && lastUserMessage) {
    await supabase
      .from('chat_mesej')
      .insert({ sesi_id: sesiId, peranan: 'user', kandungan: lastUserMessage })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 })
  }

  const ctx: AiUserContext = {
    userId: profile.id,
    role: profile.peranan as UserRole,
  }

  // ─── Layer 1: Server-side pre-flight role guard ────────────────────────
  // Block restricted questions before they EVER reach the AI model.
  const roleScope = AI_ROLE_SCOPE[profile.peranan] ?? null
  if (roleScope) {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content ?? ''
    for (const pattern of roleScope.blocked) {
      if (pattern.test(lastUserMessage)) {
        return NextResponse.json(
          { reply: roleScope.rejectMessage },
          { status: 200 } // return 200 so frontend renders it as a normal AI reply
        )
      }
    }
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)

    // ─── Layer 2: Inject dynamic role-aware system instruction into AI ──────
    const dynamicSystemInstruction = `${SYSTEM_PROMPT}

═══════════════════════
KONTEKS PENGGUNA YANG TERHUBUNG SEKARANG:
═══════════════════════
- Peranan Pengguna: ${profile.peranan.toUpperCase()}
- ID Pengguna: ${profile.id}

Peraturan had skop [${profile.peranan.toUpperCase()}] di atas adalah WAJIB untuk pengguna ini. Jika soalan menyentuh topik yang dilarang untuk peranan ini, tolak dengan mesej yang sesuai tanpa memberikan sebarang maklumat.`

    const model = genAI.getGenerativeModel({
      model: 'gemini-3.1-flash-lite',
      systemInstruction: dynamicSystemInstruction,
    })

    // Build conversation contents (user + model turns only)
    const contents: Content[] = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    let reply = ''
    let pdfUrl: string | undefined

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const result = await model.generateContent({
        contents,
        tools: [{ functionDeclarations: toolDeclarations }],
      })
      const response = result.response
      const calls = response.functionCalls?.() ?? []

      if (calls.length === 0) {
        reply = response.text() ?? ''
        break
      }

      // Append the model's function-call turn to history
      const modelContent = response.candidates?.[0]?.content
      if (modelContent) contents.push(modelContent)

      // Execute each tool call and feed results back
      for (const call of calls) {
        let toolResult: object
        try {
          toolResult = await dispatchAiTool(call.name, call.args ?? {}, supabase, ctx)
          if (call.name === 'generate_kronologi_pdf') {
            const url = (toolResult as { url?: string }).url
            if (url) pdfUrl = url
          }
        } catch (err) {
          toolResult = { error: err instanceof Error ? err.message : 'Error processing the tool.' }
        }
        contents.push({
          role: 'function',
          parts: [{ functionResponse: { name: call.name, response: safeJson(toolResult) } }],
        })
      }
    }

    if (!reply) {
      reply = 'Sorry, I could not process that request. Please try again.'
    }

    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content ?? ''
    const isStructured = detectStructuredRequest(lastUserMessage)
    const cleanedReply = cleanAiResponse(reply, isStructured)

    // Persist the assistant reply and bump session recency.
    if (sesiId) {
      await supabase
        .from('chat_mesej')
        .insert({ sesi_id: sesiId, peranan: 'assistant', kandungan: cleanedReply })
      await supabase
        .from('chat_sesi')
        .update({ dikemaskini_pada: new Date().toISOString() })
        .eq('id', sesiId)
    }

    return NextResponse.json({
      reply: cleanedReply,
      ...(pdfUrl ? { downloadUrl: pdfUrl } : {}),
      ...(sesiId ? { sesiId } : {}),
    })
  } catch (err) {
    Sentry.captureException(err, { extra: { userId: profile.id, role: profile.peranan } })
    console.error('[AI Chat Error]', err)
    return NextResponse.json(
      { error: 'Error communicating with the AI service. Please try again.' },
      { status: 500 }
    )
  }
}
