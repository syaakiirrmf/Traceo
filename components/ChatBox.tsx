'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Send, Sparkles, UserRound, Bot, FileText, Plus, MessageSquare, Trash2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatSession {
  id: string
  tajuk: string
  dikemaskini_pada?: string
}

const SUGGESTIONS = [
  'List facilities that are overdue',
  'What is the total amount of arrears?',
  'Show the latest follow-ups',
]

interface ChatBoxProps {
  userName?: string
}

function formatSesiDate(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) {
    return d.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('ms-MY', { day: '2-digit', month: 'short' })
}

export function ChatBox({ userName }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSesiId, setActiveSesiId] = useState<string | null>(null)
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  const refreshSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/history')
      if (!res.ok) return
      const data = await res.json()
      setSessions(data.sessions ?? [])
    } catch {
      // silent — sidebar stays empty
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function muatAwal() {
      try {
        const res = await fetch('/api/chat/history')
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) setSessions(data.sessions ?? [])
      } catch {
        // silent — sidebar stays empty
      } finally {
        if (!cancelled) setLoadingSessions(false)
      }
    }
    muatAwal()
    return () => {
      cancelled = true
    }
  }, [])

  async function openSesi(sesiId: string) {
    if (loading) return
    setActiveSesiId(sesiId)
    setMessages([])
    setError(null)
    setLoadingMessages(true)
    try {
      const res = await fetch(`/api/chat/history/${sesiId}`)
      if (!res.ok) throw new Error('Failed to load conversation')
      const data = await res.json()
      setMessages((data.messages ?? []).map((m: { peranan: string; kandungan: string }) => ({
        role: m.peranan as 'user' | 'assistant',
        content: m.kandungan,
      })))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred.')
    } finally {
      setLoadingMessages(false)
    }
  }

  async function buatSesiBaharu() {
    if (loading) return
    setActiveSesiId(null)
    setMessages([])
    setInput('')
    setError(null)
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }

  async function padamSesi(sesiId: string) {
    if (loading) return
    const prevId = activeSesiId
    setSessions((prev) => prev.filter((s) => s.id !== sesiId))
    if (prevId === sesiId) {
      setActiveSesiId(null)
      setMessages([])
    }
    try {
      const res = await fetch(`/api/chat/history/${sesiId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete conversation')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred.')
      refreshSessions()
    }
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const history: Message[] = [...messages, { role: 'user', content: trimmed }]
    setMessages(history)
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, sesiId: activeSesiId ?? undefined }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error ?? 'Request failed')
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
      if (data.sesiId && data.sesiId !== activeSesiId) {
        setActiveSesiId(data.sesiId)
      }
      refreshSessions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full min-h-0">
      {/* ─── Session sidebar ─────────────────────────────────────────────── */}
      <aside className="w-60 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col min-h-0">
        <div className="p-3 border-b border-[var(--color-border)]">
          <button
            type="button"
            onClick={buatSesiBaharu}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--color-brand)] text-white text-xs font-semibold hover:bg-[var(--color-brand-hover)] transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            <Plus size={14} />
            New Session
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
          {loadingSessions ? (
            <p className="px-3 py-2 text-xs text-[var(--color-text-tertiary)]">
              Loading history…
            </p>
          ) : sessions.length === 0 ? (
            <p className="px-3 py-2 text-xs text-[var(--color-text-tertiary)]">
              No conversation history.
            </p>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                className={`group flex items-center gap-1.5 rounded-lg px-2 py-2 text-left transition-colors ${
                  activeSesiId === s.id
                    ? 'bg-[var(--color-brand-subtle)] text-[var(--color-brand)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)]'
                }`}
              >
                <MessageSquare size={13} className="flex-shrink-0" />
                <button
                  type="button"
                  onClick={() => openSesi(s.id)}
                  disabled={loading}
                  className="flex-1 min-w-0 text-left"
                >
                  <span className="block truncate text-xs font-medium">{s.tajuk}</span>
                  {s.dikemaskini_pada && (
                    <span className="block text-[10px] text-[var(--color-text-tertiary)] mt-0.5">
                      {formatSesiDate(s.dikemaskini_pada)}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => padamSesi(s.id)}
                  disabled={loading}
                  aria-label="Delete conversation"
                  className="p-1 rounded-md text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-100 hover:text-[var(--color-danger)] transition-opacity disabled:opacity-30"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* ─── Chat panel ──────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 bg-[var(--color-surface)]">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-5 h-13 border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]/50 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-[var(--color-brand)] flex items-center justify-center">
            <Sparkles size={14} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--color-text-primary)] leading-tight">
              @syaakiirr
            </p>
            <p className="text-[11px] text-[var(--color-text-tertiary)] leading-tight">
              {userName
                ? `Hi ${userName}, anything I can help you with?`
                : 'A smart assistant that knows the ins and outs of facilities & follow-ups'}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-5 py-5 space-y-4 min-h-0"
        >
          {loadingMessages && (
            <div className="flex items-center justify-center py-10">
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Loading conversation…
              </p>
            </div>
          )}

          {!loadingMessages && messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
              <div className="w-11 h-11 rounded-xl bg-[var(--color-brand-subtle)] flex items-center justify-center">
                <Bot size={20} className="text-[var(--color-brand)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Ask anything about facilities
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-1 max-w-sm">
                  I am @syaakiirr, i can help you to check facility status, total arrears, and
                  follow-up activity directly from the database.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-md">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-secondary)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-[var(--color-brand-subtle)] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot size={14} className="text-[var(--color-brand)]" />
                </div>
              )}
              <div
                className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-[var(--color-brand)] text-white rounded-2xl rounded-br-md whitespace-pre-wrap'
                    : 'bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-2xl rounded-tl-md'
                }`}
              >
                {m.role === 'user' ? (
                  m.content
                ) : (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkBreaks]}
                      components={{
                        a: ({ href, children }) => {
                          const url = href ?? ''
                          const isPdf = url.includes('kronologi-pdf')
                          return (
                            <a
                              href={url}
                              target={url.startsWith('http') ? '_blank' : undefined}
                              rel="noopener noreferrer"
                              className={`inline-flex items-center gap-1.5 font-semibold underline underline-offset-2 ${
                                isPdf
                                  ? 'text-[var(--color-brand)] font-bold'
                                  : 'text-blue-600'
                              }`}
                            >
                              {isPdf && <FileText size={14} className="flex-shrink-0" />}
                              {children}
                            </a>
                          )
                        },
                        p: ({ children }) => (
                          <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc list-inside space-y-1 mb-2 last:mb-0 pl-1">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal list-inside space-y-1 mb-2 last:mb-0 pl-1">
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                        h1: ({ children }) => (
                          <h1 className="text-base font-bold text-slate-900 mt-3 mb-1.5">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-sm font-bold text-slate-900 mt-2.5 mb-1">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-sm font-semibold text-slate-800 mt-2 mb-1">
                            {children}
                          </h3>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-semibold text-slate-900">{children}</strong>
                        ),
                        code: ({ children }) => (
                          <code className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-xs border border-slate-200">
                            {children}
                          </code>
                        ),
                        table: ({ children }) => (
                          <div className="overflow-x-auto my-2 rounded-lg border border-slate-200">
                            <table className="min-w-full text-xs text-left border-collapse">
                              {children}
                            </table>
                          </div>
                        ),
                        th: ({ children }) => (
                          <th className="bg-slate-100 px-3 py-1.5 font-semibold border-b border-slate-200">
                            {children}
                          </th>
                        ),
                        td: ({ children }) => (
                          <td className="px-3 py-1.5 border-b border-slate-100">{children}</td>
                        ),
                      }}
                    >
                      {m.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
              {m.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <UserRound size={14} className="text-[var(--color-text-tertiary)]" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5 justify-start">
              <div className="w-7 h-7 rounded-lg bg-[var(--color-brand-subtle)] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot size={14} className="text-[var(--color-brand)]" />
              </div>
              <div className="px-4 py-3 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-2xl rounded-tl-md">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-tertiary)] animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-tertiary)] animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-tertiary)] animate-bounce [animation-delay:0.3s]" />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="px-4 py-2.5 rounded-lg bg-[var(--color-danger-subtle)] text-xs text-[var(--color-danger)]">
              {error}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface-raised)]/30 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              sendMessage(input)
            }}
            className="flex items-end gap-2.5"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage(input)
                }
              }}
              rows={1}
              placeholder="Type your question…"
              className="flex-1 resize-none px-3.5 py-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="h-10 w-10 flex-shrink-0 rounded-lg bg-[var(--color-brand)] text-white flex items-center justify-center hover:bg-[var(--color-brand-hover)] transition-colors disabled:opacity-40 disabled:pointer-events-none"
              aria-label="Send"
            >
              <Send size={16} />
            </button>
          </form>
          <p className="text-[11px] text-[var(--color-text-tertiary)] mt-2">
            AI assistant engine engineered by{' '}
            <strong className="font-semibold text-[var(--color-brand)]">@syaakiirr</strong>.
            Answers are generated based on real data from the database.
          </p>
        </div>
      </div>
    </div>
  )
}