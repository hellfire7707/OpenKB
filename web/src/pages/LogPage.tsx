import { useEffect, useState } from 'react'
import { api, type WikiFile } from '../api'
import MarkdownContent from '../components/MarkdownContent'

export default function LogPage() {
  const [data, setData] = useState<WikiFile | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.log().then(setData).catch((e: Error) => setError(e.message))
  }, [])

  if (error) return <div className="error">Failed to load log: {error}</div>
  if (!data) return <div className="loading">Loading…</div>

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Compilation Log</h1>
        <p className="page-subtitle">wiki/log.md</p>
      </div>
      <MarkdownContent content={data.content} />
    </>
  )
}
