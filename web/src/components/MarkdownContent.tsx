import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Link } from 'react-router-dom'

function transformWikiLinks(content: string): string {
  return content.replace(/\[\[([^\]]+)\]\]/g, (_, raw) => {
    const path = raw.trim()
    const parts = path.split('/')
    const label = parts[parts.length - 1]
    if (parts.length >= 2) {
      return `[${label}](/${parts[0]}/${parts[1]})`
    }
    return `[${label}](/${path})`
  })
}

export default function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a({ href, children }) {
            if (href?.startsWith('/')) {
              return <Link to={href}>{children}</Link>
            }
            return (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            )
          },
        }}
      >
        {transformWikiLinks(content)}
      </ReactMarkdown>
    </div>
  )
}
