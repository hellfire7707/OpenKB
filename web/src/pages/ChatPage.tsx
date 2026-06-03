import { useState, useRef, useEffect } from 'react'
import MarkdownContent from '../components/MarkdownContent'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
}

const WELCOME: Message = {
  id: 0,
  role: 'assistant',
  content: '안녕하세요! 위키 지식 베이스에 대해 질문해 주세요.\n왼쪽에서 KB에 포함된 문서를 확인할 수 있습니다.',
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const sessionId = useRef(crypto.randomUUID())
  const nextId = useRef(1)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setLoading(true)

    const userId = nextId.current++
    const assistantId = nextId.current++
    setMessages(prev => [
      ...prev,
      { id: userId, role: 'user', content: text },
      { id: assistantId, role: 'assistant', content: '' },
    ])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, session_id: sessionId.current }),
      })

      if (!res.ok || !res.body) throw new Error(`서버 오류 ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6)
          if (raw === '[DONE]') break
          try {
            const parsed = JSON.parse(raw)
            if (parsed.text) {
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId ? { ...m, content: m.content + parsed.text } : m
                )
              )
            }
            if (parsed.error) {
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId ? { ...m, content: `오류: ${parsed.error}` } : m
                )
              )
            }
          } catch { /* 불완전한 청크 무시 */ }
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '알 수 없는 오류'
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId ? { ...m, content: `오류가 발생했습니다: ${msg}` } : m
        )
      )
    } finally {
      setLoading(false)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const lastMsg = messages[messages.length - 1]

  return (
    <div className="chat-wrapper">
      <div className="chat-main">
        <div className="chat-messages">
          {messages.map(msg => {
            const isTyping = loading && msg.id === lastMsg?.id && msg.role === 'assistant' && !msg.content
            return (
              <div key={msg.id} className={`chat-msg chat-msg--${msg.role}`}>
                {msg.role === 'assistant' && <div className="chat-avatar">K</div>}
                {isTyping ? (
                  <div className="chat-bubble chat-bubble--typing">
                    <span /><span /><span />
                  </div>
                ) : msg.role === 'assistant' ? (
                  <div className="chat-bubble chat-bubble--md">
                    <MarkdownContent content={msg.content} />
                  </div>
                ) : (
                  <div className="chat-bubble">{msg.content}</div>
                )}
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
        <div className="chat-input-area">
          <textarea
            className="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="질문을 입력하세요… (Enter 전송 / Shift+Enter 줄바꿈)"
            rows={1}
            disabled={loading}
          />
          <button className="chat-send-btn" onClick={send} disabled={!input.trim() || loading}>
            {loading ? '…' : '전송'}
          </button>
        </div>
      </div>
    </div>
  )
}
