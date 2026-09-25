import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import Login from './pages/Login'

function PlaceholderPage({ title }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
      <p className="text-slate-500 mt-2">This page will be built in an upcoming step.</p>
    </div>
  )
}

function LoginPlaceholder() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <p className="text-slate-500">Login page will be built in Step 8.</p>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <PlaceholderPage title="Dashboard" />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/attendance"
        element={
          <ProtectedRoute>
            <AppLayout>
              <PlaceholderPage title="Attendance" />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/students"
        element={
          <ProtectedRoute>
            <AppLayout>
              <PlaceholderPage title="Students" />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/students/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <PlaceholderPage title="Student Detail" />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/classes"
        element={
          <ProtectedRoute>
            <AppLayout>
              <PlaceholderPage title="Classes" />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <AppLayout>
              <PlaceholderPage title="Reports" />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute requireAdmin>
            <AppLayout>
              <PlaceholderPage title="Settings" />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App