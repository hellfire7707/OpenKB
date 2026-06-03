import { useEffect, useState } from 'react'
import { api, type WikiFile } from '../api'
import MarkdownContent from '../components/MarkdownContent'

export default function HomePage() {
  const [data, setData] = useState<WikiFile | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.index().then(setData).catch((e: Error) => setError(e.message))
  }, [])

  if (error) return <div className="error">Failed to load index: {error}</div>
  if (!data) return <div className="loading">Loading…</div>

  return <MarkdownContent content={data.content} />
}
