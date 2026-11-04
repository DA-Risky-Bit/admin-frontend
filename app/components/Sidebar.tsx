import { NavLink } from 'react-router'
import { FaList } from 'react-icons/fa'
import { MdDashboard } from 'react-icons/md'

const items = [
  { to: '/', label: 'Dashboard', icon: <MdDashboard /> },
  { to: '/docker', label: 'Container Table', icon: <FaList /> }
]

export default function AdminSidebar() {
  return (
    <aside className="h-screen w-48 shrink-0 border-r border-border bg-surface">
      <div className="border-b border-border bg-surface-raised px-3 py-2 font-semibold">Admin</div>
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
