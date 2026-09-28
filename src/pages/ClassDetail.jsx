import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getClassById } from '../services/classService'
import { getAllStudents, updateStudent } from '../services/studentService'
import StudentQrModal from '../components/StudentQrModal'
export default function ClassDetail() {
  const { id } = useParams()
  
  const [classItem, setClassItem] = useState(null)
  const [allStudents, setAllStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [actionMessage, setActionMessage] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    setLoading(true)
    setError('')
    setNotFound(false)

    try {
      const [classData, students] = await Promise.all([
        getClassById(id),
        getAllStudents(),
      ])

      if (!classData) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setClassItem(classData)
      setAllStudents(students)
    } catch (err) {
      setError('Failed to load class.')
    } finally {
      setLoading(false)
    }
  }

  const studentsInClass = allStudents.filter((s) => s.classId === id)
  const availableStudents = allStudents.filter((s) => s.classId !== id)

  async function handleAssign(e) {
    e.preventDefault()
    if (!selectedStudentId) return

    setAssigning(true)
    setActionMessage('')

    try {
      const student = allStudents.find((s) => s.id === selectedStudentId)
      await updateStudent(selectedStudentId, {
        name: student.name,
        studentId: student.studentId,
        classId: id,
        phone: student.phone,
        gender: student.gender,
      })
      setSelectedStudentId('')
      setActionMessage('Student assigned to this class.')
      loadData()
    } catch (err) {
      setError('Failed to assign student.')
    } finally {
      setAssigning(false)
    }
  }

  async function handleRemove(student) {
    setActionMessage('')

    try {
      await updateStudent(student.id, {
        name: student.name,
        studentId: student.studentId,
        classId: null,
        phone: student.phone,
        gender: student.gender,
      })
      setActionMessage(`${student.name} removed from this class.`)
      loadData()
    } catch (err) {
      setError('Failed to remove student.')
    }
  }

  if (loading) {
    return <p className="text-slate-500">Loading class...</p>
  }

  if (notFound) {
    return (
      <div>
        <p className="text-red-600 mb-4">Class not found.</p>
        <Link to="/classes" className="text-blue-600 hover:text-blue-700">
          &larr; Back to Classes
        </Link>
      </div>
    )
  }

  if (error) {
    return <p className="text-red-600">{error}</p>
  }

  return (
    <div>
      <Link to="/classes" className="text-blue-600 hover:text-blue-700 text-sm">
        &larr; Back to Classes
      </Link>

      <div className="flex items-center justify-between mt-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{classItem.name}</h2>
          {classItem.description && (
            <p className="text-slate-500 text-sm mt-1">{classItem.description}</p>
          )}
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            classItem.active
              ? 'bg-green-100 text-green-700'
              : 'bg-slate-100 text-slate-500'
          }`}
        >
          {classItem.active ? 'active' : 'inactive'}
        </span>
      </div>

      {actionMessage && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2 mb-4">
          {actionMessage}
        </p>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="font-semibold text-slate-800 mb-3">Assign a Student</h3>
        <form onSubmit={handleAssign} className="flex flex-wrap gap-3">
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a student...</option>
            {availableStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.studentId})
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!selectedStudentId || assigning}
            className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {assigning ? 'Assigning...' : 'Assign'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">
            Students in this Class ({studentsInClass.length})
          </h3>
        </div>

        {studentsInClass.length === 0 && (
          <p className="text-slate-500 p-4">No students assigned yet.</p>
        )}

        {studentsInClass.length > 0 && (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Student ID</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {studentsInClass.map((student) => (
                <tr key={student.id}>
                  <td className="px-4 py-2 font-medium text-slate-800">
                    <Link
                      to={`/students/${student.id}`}
                      className="hover:text-blue-600"
                    >
                      {student.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{student.studentId}</td>
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
                    <button
                      onClick={() => handleRemove(student)}
                      className="text-red-600 hover:text-red-700 font-medium"
                    >
                      Remove
                    </button>
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