import { NavLink, Link } from 'react-router-dom'

const topLinks = [
  { to: '/', label: 'Overview', icon: '◎', exact: true },
  { to: '/chat', label: 'Chat', icon: '◉', exact: false }, // 김정민 20260603 추가
]

const wikiLinks = [
  { to: '/summaries', label: 'Documents', icon: '≡' },
  { to: '/concepts', label: 'Concepts', icon: '◆' },
  { to: '/entities', label: 'Entities', icon: '◇' },
  { to: '/log', label: 'Log', icon: '·' },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link to="/" className="sidebar-logo">
          <div className="sidebar-logo-mark">K</div>
          OpenKB
        </Link>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section">
          {topLinks.map(({ to, label, icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span className="nav-link-icon">{icon}</span>
              {label}
            </NavLink>
          ))}
        </div>
        <div className="nav-section">
          <div className="nav-section-label">Wiki</div>
          {wikiLinks.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span className="nav-link-icon">{icon}</span>
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </aside>
  )
}
