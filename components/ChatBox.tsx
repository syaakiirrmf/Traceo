'use client'

import { useRef, useState, useEffect } from 'react'
import { Send, Sparkles, UserRound, Bot, FileText } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTIONS = [
  'List facilities that are overdue',
  'What is the total amount of arrears?',
  'Show the latest follow-ups',
]

interface ChatBoxProps {
  userName?: string
}

export function ChatBox({ userName }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

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
        body: JSON.stringify({ messages: history }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error ?? 'Request failed')
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-xs overflow-hidden">
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
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4 min-h-0">
        {messages.length === 0 && !loading && (
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
                              isPdf ? 'text-[var(--color-brand)] font-bold' : 'text-blue-600'
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
                        <h2 className="text-sm font-bold text-slate-900 mt-2.5 mb-1">{children}</h2>
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
          <strong className="font-semibold text-[var(--color-brand)]">@syaakiirr</strong>. Answers
          are generated based on real data from the database.
        </p>
      </div>
    </div>
  )
}
