import { useEffect, useMemo, useState } from 'react'
import { getAllStudents } from '../services/studentService'
import { getAllClasses } from '../services/classService'
import {
  getAttendanceByDateRange,
  getTodayDateString,
} from '../services/attendanceService'
import { formatEthiopianDate } from '../utils/dateFormatting'

function shiftDate(dateString, days) {
  const date = new Date(dateString + 'T00:00:00Z')
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function getRange(period, dateValue, monthValue) {
  if (period === 'daily') {
    return { start: dateValue, end: dateValue }
  }

  if (period === 'weekly') {
    return { start: shiftDate(dateValue, -6), end: dateValue }
  }

  const [year, month] = monthValue.split('-').map(Number)
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return {
    start: `${monthValue}-01`,
    end: `${monthValue}-${String(lastDay).padStart(2, '0')}`,
  }
}

function percent(part, total) {
  if (!total) return '—'
  return ((part / total) * 100).toFixed(1) + '%'
}

export default function Reports() {
  const today = getTodayDateString()

  const [period, setPeriod] = useState('daily')
  const [dateValue, setDateValue] = useState(today)
  const [monthValue, setMonthValue] = useState(today.slice(0, 7))
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [studentSearch, setStudentSearch] = useState('')

  const range = getRange(period, dateValue, monthValue)

  useEffect(() => {
    loadBaseData()
  }, [])

  useEffect(() => {
    loadRecords()
  }, [range.start, range.end])

  async function loadBaseData() {
    try {
      const [studentList, classList] = await Promise.all([
        getAllStudents(),
        getAllClasses(),
      ])
      setStudents(studentList)
      setClasses(classList)
    } catch (err) {
      setError('Failed to load students and classes.')
    }
  }

  async function loadRecords() {
    setLoading(true)
    setError('')

    try {
      const data = await getAttendanceByDateRange(range.start, range.end)
      setRecords(data)
    } catch (err) {
      setError('Failed to load attendance records.')
    } finally {
      setLoading(false)
    }
  }

  const report = useMemo(() => {
    const sessionDates = new Set(records.map((r) => r.date))
    const sessions = sessionDates.size

    const presentByStudent = {}
    records.forEach((r) => {
      presentByStudent[r.studentId] = (presentByStudent[r.studentId] || 0) + 1
    })

    const relevantStudents = students.filter(
      (s) => s.status === 'active' || presentByStudent[s.id] > 0
    )
    const activeCount = students.filter((s) => s.status === 'active').length

    const byDayMap = {}
    records.forEach((r) => {
      if (!byDayMap[r.date]) {
        byDayMap[r.date] = { date: r.date, present: 0, inside: 0, completed: 0 }
      }
      byDayMap[r.date].present += 1
      if (r.status === 'inside') byDayMap[r.date].inside += 1
      if (r.status === 'completed') byDayMap[r.date].completed += 1
    })
    const byDay = Object.values(byDayMap)
      .map((d) => ({ ...d, absent: Math.max(activeCount - d.present, 0) }))
      .sort((a, b) => b.date.localeCompare(a.date))

    const classRows = classes.map((c) => {
      const classStudents = relevantStudents.filter((s) => s.classId === c.id)
      const present = classStudents.reduce(
        (sum, s) => sum + (presentByStudent[s.id] || 0),
        0
      )
      return {
        id: c.id,
        name: c.name,
        studentCount: classStudents.length,
        present,
        rate: percent(present, classStudents.length * sessions),
      }
    })

    const unassigned = relevantStudents.filter((s) => !s.classId)
    if (unassigned.length > 0) {
      const present = unassigned.reduce(
        (sum, s) => sum + (presentByStudent[s.id] || 0),
        0
      )
      classRows.push({
        id: 'none',
        name: 'No Class',
        studentCount: unassigned.length,
        present,
        rate: percent(present, unassigned.length * sessions),
      })
    }

    const studentRows = relevantStudents
      .map((s) => {
        const present = presentByStudent[s.id] || 0
        const classItem = classes.find((c) => c.id === s.classId)
        return {
          id: s.id,
          name: s.name,
          studentId: s.studentId,
          className: classItem ? classItem.name : '—',
          present,
          absent: Math.max(sessions - present, 0),
          rate: percent(present, sessions),
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))

    const totalPresent = records.length

    return {
      sessions,
      totalPresent,
      average: sessions > 0 ? (totalPresent / sessions).toFixed(1) : '0',
      overallRate: percent(totalPresent, activeCount * sessions),
      byDay,
      classRows,
      studentRows,
    }
  }, [records, students, classes])

  const filteredStudentRows = report.studentRows.filter(
    (row) =>
      row.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      row.studentId.toLowerCase().includes(studentSearch.toLowerCase())
  )

  const periodTabs = [
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Reports</h2>

      <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {periodTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setPeriod(tab.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                period === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {period !== 'monthly' && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-500">
              {period === 'weekly' ? 'Week ending' : 'Date'}
            </label>
            <input
              type="date"
              value={dateValue}
              onChange={(e) => e.target.value && setDateValue(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {period === 'monthly' && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-500">Month</label>
            <input
              type="month"
              value={monthValue}
              onChange={(e) => e.target.value && setMonthValue(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <p className="text-xs text-slate-400 ml-auto">
          {formatEthiopianDate(range.start)} → {formatEthiopianDate(range.end)}
        </p>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}
      {loading && <p className="text-slate-500">Loading report...</p>}

      {!loading && !error && report.sessions === 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-slate-500">
            No attendance records in this period.
          </p>
        </div>
      )}

      {!loading && !error && report.sessions > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-slate-500">Sessions</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">
                {report.sessions}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-slate-500">Total Check-ins</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {report.totalPresent}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-slate-500">Average per Session</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {report.average}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-slate-500">Attendance Rate</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">
                {report.overallRate}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Attendance by Day</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-left">
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Present</th>
                  <th className="px-4 py-2">Absent</th>
                  <th className="px-4 py-2">Inside</th>
                  <th className="px-4 py-2">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.byDay.map((day) => (
                  <tr key={day.date}>
                    <td className="px-4 py-2 font-medium text-slate-800">
                      {formatEthiopianDate(day.date)}
                    </td>
                    <td className="px-4 py-2 text-green-700">{day.present}</td>
                    <td className="px-4 py-2 text-red-600">{day.absent}</td>
                    <td className="px-4 py-2 text-slate-600">{day.inside}</td>
                    <td className="px-4 py-2 text-slate-600">{day.completed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Attendance by Class</h3>
            </div>
            {report.classRows.length === 0 && (
              <p className="text-slate-500 p-4 text-sm">No classes yet.</p>
            )}
            {report.classRows.length > 0 && (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-left">
                  <tr>
                    <th className="px-4 py-2">Class</th>
                    <th className="px-4 py-2">Students</th>
                    <th className="px-4 py-2">Check-ins</th>
                    <th className="px-4 py-2">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.classRows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-2 font-medium text-slate-800">
                        {row.name}
                      </td>
                      <td className="px-4 py-2 text-slate-600">
                        {row.studentCount}
                      </td>
                      <td className="px-4 py-2 text-slate-600">{row.present}</td>
                      <td className="px-4 py-2 text-slate-800 font-medium">
                        {row.rate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-semibold text-slate-800">
                Attendance by Student
              </h3>
              <input
                type="text"
                placeholder="Search student..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {filteredStudentRows.length === 0 && (
              <p className="text-slate-500 p-4 text-sm">No students found.</p>
            )}
            {filteredStudentRows.length > 0 && (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-left">
                  <tr>
                    <th className="px-4 py-2">Student</th>
                    <th className="px-4 py-2">Class</th>
                    <th className="px-4 py-2">Present</th>
                    <th className="px-4 py-2">Absent</th>
                    <th className="px-4 py-2">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudentRows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-2 font-medium text-slate-800">
                        {row.name}
                        <span className="text-slate-400 font-normal ml-2">
                          {row.studentId}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-slate-600">
                        {row.className}
                      </td>
                      <td className="px-4 py-2 text-green-700">{row.present}</td>
                      <td className="px-4 py-2 text-red-600">{row.absent}</td>
                      <td className="px-4 py-2 text-slate-800 font-medium">
                        {row.rate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}