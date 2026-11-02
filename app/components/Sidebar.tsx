import { NavLink } from 'react-router'
import { FaList } from 'react-icons/fa'
import { MdDashboard } from 'react-icons/md'

const items = [
  { to: '/', label: 'Dashboard', icon: <MdDashboard /> },
  { to: '/docker', label: 'Container Table', icon: <FaList /> }
]

export default function AdminSidebar() {
  return (
    <aside className="h-screen w-48 shrink-0 border-r border-[#3a3a3a] bg-[#242424]">
      <div className="border-b border-[#3a3a3a] bg-[#2f2f2f] px-3 py-2 font-semibold">Admin</div>
      <nav className="flex flex-col">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              `flex items-center gap-2 border-b border-[#2c2c2c] px-3 py-2 hover:bg-[#2c2c2c] ${isActive ? 'bg-[#3d6fa5] text-white' : 'text-[#aaa]'}`
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
