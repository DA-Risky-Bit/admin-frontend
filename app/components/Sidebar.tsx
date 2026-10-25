import { useState } from 'react'
import { NavLink } from 'react-router' // 'react-router-dom' if you're on v6
import { FaDocker } from "react-icons/fa";
import { MdDashboard } from "react-icons/md";

interface NavItem {
  to: string
  label: string
  icon: SVGRectElement
}

// Edit these to match your routes
const items: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: <MdDashboard /> },
  { to: '/docker', label: 'Containers', icon: <FaDocker /> },
]

export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside style={{ ...styles.aside, width: collapsed ? 64 : 220 }}>
      <div style={{ ...styles.header, justifyContent: collapsed ? 'center' : 'space-between' }}>
        {!collapsed && <strong>Admin</strong>}
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label="Toggle sidebar"
          style={styles.toggle}
        >
          {collapsed ? '»' : '«'}
        </button>
      </div>

      <nav style={styles.nav}>
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'} // otherwise "/" would match every route
            title={item.label}
            style={({ isActive }) => ({
              ...styles.link,
              ...(isActive ? styles.active : {}),
              justifyContent: collapsed ? 'center' : 'flex-start',
            })}
          >
            <span>{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

const styles: Record<string, React.CSSProperties> = {
  aside: {
    height: '100vh',
    background: '#161616',
    color: '#ddd',
    borderRight: '1px solid #2a2a2a',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.15s ease',
    fontFamily: 'system-ui, sans-serif',
    flex: 'none',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '14px 12px',
    borderBottom: '1px solid #2a2a2a',
  },
  toggle: {
    background: 'none',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    fontSize: 16,
  },
  nav: { display: 'flex', flexDirection: 'column', gap: 2, padding: 8 },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 6,
    color: '#aaa',
    textDecoration: 'none',
    fontSize: 14,
  },
  active: { background: '#2a2a2a', color: '#fff' },
}
