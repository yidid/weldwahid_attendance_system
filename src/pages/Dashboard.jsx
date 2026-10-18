import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllStudents } from '../services/studentService'
import { getAttendanceByDate, getTodayDateString } from '../services/attendanceService'
import { formatEthiopianDate } from '../utils/dateFormatting'
import { useAuth } from '../contexts/AuthContext'

function withTimeout(promise, milliseconds) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Dashboard request timed out.')), milliseconds)
    }),
  ])
}

export default function Dashboard() {
  const { userProfile } = useAuth()
  const userName = userProfile?.name?.split(' ')[0]
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({
    totalStudents: 0,
    present: 0,
    absent: 0,
    currentlyInside: 0,
    completed: 0,
  })

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    setLoading(true)
    setError('')

    try {
      const today = getTodayDateString()
      const [students, todayAttendance] = await withTimeout(
        Promise.all([getAllStudents(), getAttendanceByDate(today)]),
        10000,
      )

      const activeStudents = students.filter((s) => s.status === 'active')
      const totalStudents = activeStudents.length

      const currentlyInside = todayAttendance.filter(
        (a) => a.status === 'inside'
      ).length

      const completed = todayAttendance.filter(
        (a) => a.status === 'completed'
      ).length

      const present = currentlyInside + completed
      const absent = Math.max(totalStudents - present, 0)

      setStats({
        totalStudents,
        present,
        absent,
        currentlyInside,
        completed,
      })
    } catch (err) {
      setError('Failed to load dashboard stats.')
    } finally {
      setLoading(false)
    }
  }

  const cards = [
    { label: 'Total Students', value: stats.totalStudents, color: 'text-slate-800', icon: '●' },
    { label: 'Present Today', value: stats.present, color: 'text-emerald-600', icon: '✓' },
    { label: 'Absent Today', value: stats.absent, color: 'text-rose-600', icon: '!' },
    { label: 'Currently Inside', value: stats.currentlyInside, color: 'text-blue-600', icon: '↗' },
    { label: 'Completed', value: stats.completed, color: 'text-slate-500', icon: '◷' },
  ]

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">Overview</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">Good morning{userName ? `, ${userName}` : ''}.</h2>
          <p className="mt-1 text-sm text-slate-500">{formatEthiopianDate(getTodayDateString())}</p>
        </div>
        <Link to="/attendance" className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700">
          Scan attendance <span className="ml-2">→</span>
        </Link>
      </div>

      {loading && <p className="text-slate-500">Loading stats...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 xl:grid-cols-5 gap-3 md:gap-4">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex w-full items-center justify-between">
              <p className="text-sm leading-tight text-slate-500">{card.label}</p>
              <span className={`grid h-8 w-8 place-items-center rounded-lg bg-slate-50 text-sm font-bold ${card.color}`}>{card.icon}</span>
              </div>
              <p className={`mt-3 text-3xl font-bold ${card.color}`}>
                {card.value}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}