import { useState, useEffect } from 'react'
import { api, type WikiListItem } from '../api'

const SECTIONS = [
  { key: 'summaries', label: 'Documents' },
  { key: 'concepts', label: 'Concepts' },
  { key: 'entities', label: 'Entities' },
]

export default function ChatSidebar() {
  const [open, setOpen] = useState<Record<string, boolean>>({ summaries: true })
  const [data, setData] = useState<Record<string, WikiListItem[]>>({})

  useEffect(() => {
    SECTIONS.forEach(({ key }) => {
      api.list(key)
        .then(items => setData(prev => ({ ...prev, [key]: items })))
        .catch(() => setData(prev => ({ ...prev, [key]: [] })))
    })
  }, [])

  const toggle = (key: string) =>
    setOpen(prev => ({ ...prev, [key]: !prev[key] }))

  return (
    <div className="chat-sidebar">
      <div className="chat-sidebar-header">
        <span className="chat-sidebar-title">KB 현황</span>
      </div>
      <div className="chat-sidebar-body">
        {SECTIONS.map(({ key, label }) => {
          const items = data[key]
          return (
            <div key={key} className="chat-cat">
              <button className="chat-cat-btn" onClick={() => toggle(key)}>
                <span className={`chat-cat-arrow${open[key] ? ' open' : ''}`}>›</span>
                <span className="chat-cat-label">{label}</span>
                <span className="chat-cat-count">{items?.length ?? '…'}</span>
              </button>
              {open[key] && (
                <div className="chat-cat-items">
                  {!items ? (
                    <div className="chat-cat-empty">로딩 중…</div>
                  ) : items.length === 0 ? (
                    <div className="chat-cat-empty">없음</div>
                  ) : (
                    items.map(item => (
                      <a
                        key={item.id}
                        href={`/${key}/${item.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="chat-cat-item"
                        title="새 탭에서 열기"
                      >
                        {item.title}
                        <span className="chat-cat-item-icon">↗</span>
                      </a>
                    ))
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
