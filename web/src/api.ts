export interface WikiFile {
  id: string
  title: string
  content: string
}

export interface WikiListItem {
  id: string
  title: string
  excerpt?: string
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`/api/wiki${path}`)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export const api = {
  index: () => get<WikiFile>('/index'),
  log: () => get<WikiFile>('/log'),
  list: (section: string) => get<WikiListItem[]>(`/${section}`),
  detail: (section: string, id: string) => get<WikiFile>(`/${section}/${id}`),
}
