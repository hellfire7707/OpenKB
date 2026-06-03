import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api, type WikiFile } from '../api'
import MarkdownContent from '../components/MarkdownContent'

const SECTION_LABELS: Record<string, string> = {
  summaries: 'Documents',
  concepts: 'Concepts',
  entities: 'Entities',
}

export default function WikiDetailPage({ section }: { section: string }) {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<WikiFile | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setData(null)
    setError(null)
    api.detail(section, id).then(setData).catch((e: Error) => setError(e.message))
  }, [section, id])

  if (error) return <div className="error">Failed to load: {error}</div>
  if (!data) return <div className="loading">Loading…</div>

  return (
    <>
      <Link to={`/${section}`} className="back-link">
        &larr; {SECTION_LABELS[section] ?? section}
      </Link>
      <MarkdownContent content={data.content} />
    </>
  )
}
