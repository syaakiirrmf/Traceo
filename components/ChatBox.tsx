'use client'

import { useRef, useState, useEffect } from 'react'
import { Send, Sparkles, UserRound, Bot, FileText } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// Renders markdown-style links ([text](url)) and bare URLs as clickable anchors.
function renderContent(content: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  const regex = /\[([^\]]+)\]\(([^)]+)\)|((?:https?:\/\/|\/api\/)[^\s)\]]+)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(content.slice(lastIndex, match.index))
    }
    if (match[1] !== undefined) {
      const isPdf = match[2].includes('kronologi-pdf')
      nodes.push(
        <a
          key={key++}
          href={match[2]}
          target={match[2].startsWith('http') ? '_blank' : undefined}
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 font-semibold underline underline-offset-2 ${
            isPdf ? 'text-[var(--color-brand)]' : 'text-[var(--color-info)]'
          }`}
        >
          {isPdf && <FileText size={14} className="flex-shrink-0" />}
          {match[1]}
        </a>
      )
    } else if (match[2] !== undefined) {
      nodes.push(
        <a
          key={key++}
          href={match[2]}
          target={match[2].startsWith('http') ? '_blank' : undefined}
          rel="noopener noreferrer"
          className="font-semibold text-[var(--color-brand)] underline underline-offset-2"
        >
          {match[2]}
        </a>
      )
    }
    lastIndex = regex.lastIndex
  }

  if (lastIndex < content.length) {
    nodes.push(content.slice(lastIndex))
  }

  return nodes
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
            {userName ? `Hi ${userName}, anything I can help you with?` : 'A smart assistant that knows the ins and outs of facilities & follow-ups'}
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
                I am @syaakiirr, i can help you to check facility status, total arrears, and follow-up activity
                directly from the database.
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
              className={`max-w-[75%] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-[var(--color-brand)] text-white rounded-2xl rounded-br-md'
                  : 'bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-2xl rounded-tl-md'
              }`}
            >
              {m.role === 'user' ? m.content : renderContent(m.content)}
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
          AI answers are generated based on real data from the database. Verify critical information
          before acting.
        </p>
      </div>
    </div>
  )
}
