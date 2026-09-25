import { useEffect, useState } from 'react'
import { getAllStudents } from '../services/studentService'
import { getAttendanceByDate, getTodayDateString } from '../services/attendanceService'

export default function Dashboard() {
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
      const [students, todayAttendance] = await Promise.all([
        getAllStudents(),
        getAttendanceByDate(today),
      ])

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
    { label: 'Total Students', value: stats.totalStudents, color: 'text-slate-800' },
    { label: 'Present', value: stats.present, color: 'text-green-600' },
    { label: 'Absent', value: stats.absent, color: 'text-red-600' },
    { label: 'Currently Inside', value: stats.currentlyInside, color: 'text-blue-600' },
    { label: 'Completed', value: stats.completed, color: 'text-slate-500' },
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h2>

      {loading && <p className="text-slate-500">Loading stats...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {cards.map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-lg shadow p-4 flex flex-col items-start"
            >
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className={`text-3xl font-bold mt-1 ${card.color}`}>
                {card.value}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}