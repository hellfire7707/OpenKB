import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type WikiListItem } from '../api'

const SECTIONS: Record<string, { title: string; description: string }> = {
  summaries: { title: 'Documents', description: 'Per-document summaries compiled from source files' },
  concepts: { title: 'Concepts', description: 'Cross-document topic synthesis' },
  entities: { title: 'Entities', description: 'Named entities extracted from documents' },
}

export default function WikiListPage({ section }: { section: string }) {
  const [items, setItems] = useState<WikiListItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setItems(null)
    setError(null)
    api.list(section).then(setItems).catch((e: Error) => setError(e.message))
  }, [section])

  const meta = SECTIONS[section] ?? { title: section, description: '' }

  if (error) return <div className="error">Failed to load: {error}</div>
  if (!items) return <div className="loading">Loading…</div>

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">{meta.title}</h1>
        <p className="page-subtitle">{meta.description}</p>
      </div>
      {items.length === 0 ? (
        <div className="empty-state">
          <p>No {meta.title.toLowerCase()} found</p>
        </div>
      ) : (
        <div className="wiki-grid">
          {items.map((item) => (
            <Link key={item.id} to={`/${section}/${item.id}`} className="wiki-card">
              <div className="wiki-card-title">{item.title}</div>
              {item.excerpt && <div className="wiki-card-excerpt">{item.excerpt}</div>}
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
