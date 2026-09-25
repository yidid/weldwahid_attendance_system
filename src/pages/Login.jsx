import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    if (!email || !password) {
      setFormError('Please enter both email and password.')
      return
    }

    setSubmitting(true)

    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setFormError('Invalid email or password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-8">
        <div className="text-center mb-6">
            <img src=" /weldwahid.jpg" alt="Logo" className="mx-auto mb-4 w-30 "></img>
          <h1 className="text-xl font-bold text-green-600">መካነ ቅዱሳን ኢያቄም ወሐና ወልድ ዋህድ ሰ/ት/ቤት</h1>
          <p className="text-sm text-slate-500">መዝሙር እና ኪነጥበብ ክፍል ሲስተም</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="current-password"
            />
          </div>

          {formError && (
            <p className="text-sm text-red-600">{formError}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-green-600 text-white py-2 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? 'Logging in...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  )
}