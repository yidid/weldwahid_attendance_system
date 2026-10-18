import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '⌂' },
  { to: '/attendance', label: 'Attendance', icon: '✓' },
  { to: '/students', label: 'Students', icon: '●' },
  { to: '/classes', label: 'Classes', icon: '▦' },
  { to: '/reports', label: 'Reports', icon: '▤' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
]

export default function AppLayout({ children }) {
  const { userProfile, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      <aside className="w-full md:w-64 shrink-0 bg-slate-950 text-white border-b md:border-b-0 md:border-r border-slate-800 flex flex-col">
        <div className="px-5 py-5 md:py-6 border-b border-slate-800">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
            Sunday School
          </p>
          <h1 className="mt-1 text-lg font-bold">Attendance System</h1>
          <p className="mt-1 text-xs text-slate-400">Weld Wahid · Mezmur</p>
        </div>

        <nav className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:block px-3 py-4 md:py-6 gap-1 md:space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-950/30'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`
              }
            >
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/10 text-xs font-bold">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 md:px-5 border-t border-slate-800 flex items-center gap-3 md:block">
          <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">
            {userProfile ? userProfile.name : ''}
          </p>
          <p className="text-xs text-slate-400 capitalize">
            {userProfile ? userProfile.role : ''}
          </p>
          </div>
          <button
            onClick={handleLogout}
            className="md:mt-4 md:w-full text-sm font-medium text-rose-300 hover:text-white ml-auto md:ml-0 md:text-left"
          >
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 w-full p-4 md:p-6 overflow-y-auto">{children}</main>
    </div>
  )
}