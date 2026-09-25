import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { currentUser, userProfile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-500">Loading...</p>
      </div>
    )
  }

  if (!currentUser || !userProfile) {
    return <Navigate to="/login" replace />
  }

  if (requireAdmin && userProfile.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-red-600 font-semibold">
          You do not have permission to view this page.
        </p>
      </div>
    )
  }

  return children
}