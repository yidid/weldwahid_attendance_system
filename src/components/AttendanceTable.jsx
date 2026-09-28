import { useEffect, useState } from 'react'
import { getAllStudents } from '../services/studentService'
import { getAllClasses } from '../services/classService'
import { getAttendanceByDate, getTodayDateString } from '../services/attendanceService'

export default function AttendanceTable() {
  const [records, setRecords] = useState([])
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [dateFilter, setDateFilter] = useState(getTodayDateString())
  const [searchTerm, setSearchTerm] = useState('')
  const [classFilter, setClassFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    loadRecords()
  }, [dateFilter])

  async function loadInitialData() {
    try {
      const [studentList, classList] = await Promise.all([
        getAllStudents(),
        getAllClasses(),
      ])
      setStudents(studentList)
      setClasses(classList)
    } catch (err) {
      setError('Failed to load students/classes.')
    }
  }

  async function loadRecords() {
    setLoading(true)
    setError('')

    try {
      const data = await getAttendanceByDate(dateFilter)
      setRecords(data)
    } catch (err) {
      setError('Failed to load attendance records.')
    } finally {
      setLoading(false)
    }
  }

  function getStudent(studentId) {
    return students.find((s) => s.id === studentId) || null
  }

  function getClassName(classId) {
    const found = classes.find((c) => c.id === classId)
    return found ? found.name : '—'
  }

  function formatTime(timestamp) {
    if (!timestamp) return '—'
    return timestamp.toDate().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const enrichedRecords = records
    .map((record) => {
      const student = getStudent(record.studentId)
      return {
        ...record,
        studentName: student ? student.name : 'Unknown Student',
        classId: student ? student.classId : null,
      }
    })
    .filter((record) => {
      const matchesSearch = record.studentName
        .toLowerCase()
        .includes(searchTerm.toLowerCase())

      const matchesClass = classFilter === 'all' || record.classId === classFilter
      const matchesStatus = statusFilter === 'all' || record.status === statusFilter

      return matchesSearch && matchesClass && matchesStatus
    })
    .sort((a, b) => a.studentName.localeCompare(b.studentName))

  return (
    <div>
      <div className="bg-white rounded-lg shadow p-4 mb-4 flex flex-wrap gap-3">
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="text"
          placeholder="Search by student name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[180px] px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="inside">Inside</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {loading && <p className="text-slate-500 p-4">Loading records...</p>}
        {error && <p className="text-red-600 p-4">{error}</p>}

        {!loading && !error && enrichedRecords.length === 0 && (
          <p className="text-slate-500 p-4">No attendance records for this date.</p>
        )}

        {!loading && !error && enrichedRecords.length > 0 && (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-2">Student</th>
                <th className="px-4 py-2">Class</th>
                <th className="px-4 py-2">Entry</th>
                <th className="px-4 py-2">Exit</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enrichedRecords.map((record) => (
                <tr key={record.id}>
                  <td className="px-4 py-2 font-medium text-slate-800">
                    {record.studentName}
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {getClassName(record.classId)}
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {formatTime(record.entryTime)}
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {formatTime(record.exitTime)}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        record.status === 'inside'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}