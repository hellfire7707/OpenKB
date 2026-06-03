import { useState } from 'react'

const MOCK_SECTIONS = [
  {
    key: 'summaries',
    label: 'Documents',
    items: [
      { id: 'attention-is-all-you-need', title: 'Attention Is All You Need' },
      { id: 'Bishop-Pattern-Recognition-and-Machine-Learning-2006', title: 'Bishop — Pattern Recognition' },
      { id: 'deepseek-r1', title: 'DeepSeek-R1' },
    ],
  },
  { key: 'concepts', label: 'Concepts', items: [] },
  { key: 'entities', label: 'Entities', items: [] },
]

export default function ChatSidebar() {
  const [open, setOpen] = useState<Record<string, boolean>>({ summaries: true })

  const toggle = (key: string) =>
    setOpen(prev => ({ ...prev, [key]: !prev[key] }))

  return (
    <div className="chat-sidebar">
      <div className="chat-sidebar-header">
        <span className="chat-sidebar-title">KB 현황</span>
        <span className="chat-sidebar-hint">AI가 전체 문서를 참고합니다</span>
      </div>
      <div className="chat-sidebar-body">
        {MOCK_SECTIONS.map(({ key, label, items }) => (
          <div key={key} className="chat-cat">
            <button className="chat-cat-btn" onClick={() => toggle(key)}>
              <span className={`chat-cat-arrow${open[key] ? ' open' : ''}`}>›</span>
              <span className="chat-cat-label">{label}</span>
              <span className="chat-cat-count">{items.length}</span>
            </button>
            {open[key] && (
              <div className="chat-cat-items">
                {items.length === 0 ? (
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
        ))}
      </div>
    </div>
  )
}
