import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/attendance', label: 'Attendance' },
  { to: '/students', label: 'Students' },
  { to: '/classes', label: 'Classes' },
  { to: '/reports', label: 'Reports' },
  { to: '/settings', label: 'Settings' },
]

export default function AppLayout({ children }) {
  const { userProfile, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex bg-slate-100">
      <aside className="w-56 bg-white border-r border-slate-200 flex flex-col">
        <div className="px-4 py-5 border-b border-slate-200">
          <h1 className="text-lg font-bold text-blue-600">Sunday School</h1>
          <p className="text-xs text-slate-500">Attendance System</p>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-sm font-medium ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-slate-200">
          <p className="text-sm font-medium text-slate-800">
            {userProfile ? userProfile.name : ''}
          </p>
          <p className="text-xs text-slate-500 capitalize">
            {userProfile ? userProfile.role : ''}
          </p>
          <button
            onClick={handleLogout}
            className="mt-3 w-full text-sm font-medium text-red-600 hover:text-red-700"
          >
            Log Out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-y-auto">{children}</main>
    </div>
  )
}