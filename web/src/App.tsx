import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import WikiListPage from './pages/WikiListPage'
import WikiDetailPage from './pages/WikiDetailPage'
import LogPage from './pages/LogPage'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/summaries" element={<WikiListPage section="summaries" />} />
          <Route path="/summaries/:id" element={<WikiDetailPage section="summaries" />} />
          <Route path="/concepts" element={<WikiListPage section="concepts" />} />
          <Route path="/concepts/:id" element={<WikiDetailPage section="concepts" />} />
          <Route path="/entities" element={<WikiListPage section="entities" />} />
          <Route path="/entities/:id" element={<WikiDetailPage section="entities" />} />
          <Route path="/log" element={<LogPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
