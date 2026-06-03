import { useState, useRef, useEffect } from 'react'
import ChatSidebar from '../components/ChatSidebar'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
}

const WELCOME: Message = {
  id: 0,
  role: 'assistant',
  content: '안녕하세요! 위키 지식 베이스에 대해 질문해 주세요.\n왼쪽에서 참고할 문서를 확인할 수 있습니다.',
}

const MOCK_REPLY = '백엔드가 연결되면 위키 내용을 기반으로 답변드릴 수 있습니다. 현재는 UI 미리보기 모드입니다.'

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: text }])
    setLoading(true)
    setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: MOCK_REPLY }])
      setLoading(false)
    }, 800)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="chat-wrapper">
      <ChatSidebar />
      <div className="chat-main">
        <div className="chat-messages">
          {messages.map(msg => (
            <div key={msg.id} className={`chat-msg chat-msg--${msg.role}`}>
              {msg.role === 'assistant' && <div className="chat-avatar">K</div>}
              <div className="chat-bubble">{msg.content}</div>
            </div>
          ))}
          {loading && (
            <div className="chat-msg chat-msg--assistant">
              <div className="chat-avatar">K</div>
              <div className="chat-bubble chat-bubble--typing">
                <span /><span /><span />
              </div>
            </div>
          )}
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
          />
          <button className="chat-send-btn" onClick={send} disabled={!input.trim() || loading}>
            전송
          </button>
        </div>
      </div>
    </div>
  )
}
