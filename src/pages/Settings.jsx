import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getAllUsers, updateUserRole, ALLOWED_ROLES } from '../services/userService'

export default function Settings() {
  const { currentUser, userProfile } = useAuth()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [savingUid, setSavingUid] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    setError('')

    try {
      const list = await getAllUsers()
      setUsers(list)
    } catch (err) {
      setError('Failed to load staff accounts.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRoleChange(user, newRole) {
    if (newRole === user.role) return

    const confirmed = window.confirm(
      `Change ${user.name || user.email || 'this user'} from "${user.role}" to "${newRole}"?`
    )
    if (!confirmed) return

    setMessage('')
    setError('')
    setSavingUid(user.uid)

    try {
      await updateUserRole(user.uid, newRole)
      setMessage('Role updated successfully.')
      await loadUsers()
    } catch (err) {
      setError('Failed to update role.')
    } finally {
      setSavingUid('')
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Settings</h2>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-slate-800 mb-4">My Account</h3>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Name</dt>
              <dd className="text-slate-800 font-medium">
                {userProfile ? userProfile.name || '—' : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Email</dt>
              <dd className="text-slate-800 font-medium">
                {currentUser ? currentUser.email : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Role</dt>
              <dd className="text-slate-800 font-medium capitalize">
                {userProfile ? userProfile.role : '—'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-slate-800 mb-4">App Configuration</h3>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Timezone</dt>
              <dd className="text-slate-800 font-medium">Africa/Addis_Ababa</dd>
            </div>
            <div>
              <dt className="text-slate-500">Attendance timestamps</dt>
              <dd className="text-slate-800 font-medium">
                Recorded by the server, never by the browser
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">QR link code expiry</dt>
              <dd className="text-slate-800 font-medium">10 minutes</dd>
            </div>
          </dl>
        </div>
      </div>

      {message && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2 mb-4">
          {message}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-4">
          {error}
        </p>
      )}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">
            Staff Accounts ({users.length})
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            To add a new staff member, create the user in Firebase Console
            (Authentication), then add a matching document in the{' '}
            <span className="font-mono">users</span> collection.
          </p>
        </div>

        {loading && <p className="text-slate-500 p-4">Loading staff...</p>}

        {!loading && users.length === 0 && (
          <p className="text-slate-500 p-4">No staff accounts found.</p>
        )}

        {!loading && users.length > 0 && (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => {
                const isSelf = currentUser && user.uid === currentUser.uid

                return (
                  <tr key={user.uid}>
                    <td className="px-4 py-2 font-medium text-slate-800">
                      {user.name || '—'}
                      {isSelf && (
                        <span className="ml-2 text-xs text-blue-600 font-normal">
                          (you)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-slate-600">
                      {user.email || '—'}
                    </td>
                    <td className="px-4 py-2">
                      {isSelf ? (
                        <span className="capitalize text-slate-600">
                          {user.role}
                        </span>
                      ) : (
                        <select
                          value={user.role}
                          disabled={savingUid === user.uid}
                          onChange={(e) => handleRoleChange(user, e.target.value)}
                          className="px-2 py-1 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          {ALLOWED_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}