import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllStudents } from '../services/studentService'
import { getAllClasses } from '../services/classService'
import AddStudentModal from '../components/AddStudentModal'

export default function Students() {
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [classFilter, setClassFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError('')

    try {
      const [studentList, classList] = await Promise.all([
        getAllStudents(),
        getAllClasses(),
      ])
      setStudents(studentList)
      setClasses(classList)
    } catch (err) {
      setError('Failed to load students.')
    } finally {
      setLoading(false)
    }
  }

  function getClassName(classId) {
    const found = classes.find((c) => c.id === classId)
    return found ? found.name : '—'
  }

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesClass =
      classFilter === 'all' || student.classId === classFilter

    const matchesStatus =
      statusFilter === 'all' || student.status === statusFilter

    return matchesSearch && matchesClass && matchesStatus
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Students</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
        >
          + Add Student
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name or student ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {loading && <p className="text-slate-500 p-4">Loading students...</p>}
        {error && <p className="text-red-600 p-4">{error}</p>}

        {!loading && !error && filteredStudents.length === 0 && (
          <p className="text-slate-500 p-4">No students found.</p>
        )}

        {!loading && !error && filteredStudents.length > 0 && (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Student ID</th>
                <th className="px-4 py-2">Class</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student) => (
                <tr key={student.id}>
                  <td className="px-4 py-2 font-medium text-slate-800">
                    {student.name}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{student.studentId}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {getClassName(student.classId)}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        student.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {student.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      to={`/students/${student.id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAddForm && (
        <AddStudentModal
          classes={classes}
          onClose={() => setShowAddForm(false)}
          onCreated={() => {
            setShowAddForm(false)
            loadData()
          }}
        />
      )}
    </div>
  )
}

