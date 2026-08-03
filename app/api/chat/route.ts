import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI, type Content } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { toolDeclarations, SYSTEM_PROMPT } from '@/lib/ai/tools'
import { dispatchAiTool, type AiUserContext } from '@/lib/ai/functions'
import { cleanAiResponse } from '@/lib/ai/postProcess'
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

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('id, peranan')
    .eq('auth_id', authUser.id)
    .single()
  if (!profile) {
    return NextResponse.json({ error: 'Profil pengguna tidak dijumpai' }, { status: 401 })
  }

  let body: { messages?: ChatMessage[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Badan permintaan tidak sah' }, { status: 400 })
  }

  const messages = Array.isArray(body.messages) ? body.messages.slice(-12) : []

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY tidak dikonfigurasi' }, { status: 500 })
  }

  const ctx: AiUserContext = {
    userId: profile.id,
    role: profile.peranan as UserRole,
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.1-flash-lite',
      systemInstruction: SYSTEM_PROMPT,
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
          toolResult = { error: err instanceof Error ? err.message : 'Ralat memproses alat.' }
        }
        contents.push({
          role: 'function',
          parts: [{ functionResponse: { name: call.name, response: safeJson(toolResult) } }],
        })
      }
    }

    if (!reply) {
      reply = 'Maaf, saya tidak dapat memproses permintaan tersebut. Sila cuba lagi.'
    }

    const cleanedReply = cleanAiResponse(reply)

    return NextResponse.json({ reply: cleanedReply, ...(pdfUrl ? { downloadUrl: pdfUrl } : {}) })
  } catch (err) {
    console.error('[AI Chat Error]', err)
    return NextResponse.json(
      { error: 'Ralat komunikasi dengan perkhidmatan AI. Sila cuba lagi.' },
      { status: 500 }
    )
  }
}
