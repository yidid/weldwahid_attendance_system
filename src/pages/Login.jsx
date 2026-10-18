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
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-8">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl shadow-black/30">
        <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500" />
        <div className="p-6 sm:p-9">
        <div className="text-center mb-6">
            <img src="/weldwahid.jpg" alt="Logo" className="mx-auto mb-4 h-24 w-24 rounded-2xl object-cover ring-4 ring-emerald-50" />
          <h1 className="text-xl font-bold leading-relaxed text-slate-800">መካነ ቅዱሳን ኢያቄም ወሐና ወልድ ዋህድ ሰ/ት/ቤት</h1>
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
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
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
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              autoComplete="current-password"
            />
          </div>

          {formError && (
            <p className="text-sm text-red-600">{formError}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        </div>
      </div>
    </div>
  )
}