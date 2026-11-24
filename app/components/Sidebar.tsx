import { NavLink } from 'react-router'
import { FaList, FaMoon, FaSun, FaUsers } from 'react-icons/fa'
import { MdDashboard } from 'react-icons/md'
import { useTheme } from '../lib/toggleTheme'

const items = [
  { to: '/', label: 'Dashboard', icon: <MdDashboard /> },
  { to: '/docker', label: 'Container Table', icon: <FaList /> },
  { to: '/users', label: 'User', icon: <FaUsers /> }
]

export default function AdminSidebar() {
  const { theme, toggle } = useTheme()
  const current = theme ?? 'dark'
  const nextLabel = current === 'dark' ? 'light' : 'dark'

  return (
    <aside className="h-screen w-48 shrink-0 border-r border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border bg-surface-raised px-3 py-2">
        <span className="font-semibold">Admin</span>
        <button
          type="button"
          onClick={toggle}
          aria-label={`Switch to ${nextLabel} mode`}
          title={`Switch to ${nextLabel} mode`}
          className="rounded p-1 text-muted hover:text-default"
        >
          {current === 'dark' ? <FaSun /> : <FaMoon />}
        </button>
      </div>
      <nav className="flex flex-col">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              `flex items-center gap-2 border-b border-border px-3 py-2 ${
                isActive ? 'bg-secondary text-default' : 'text-muted hover:bg-surface-raised'
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
