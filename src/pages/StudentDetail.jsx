import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  getStudentById,
  updateStudent,
  deactivateStudent,
  activateStudent,
  linkTelegramId,
} from '../services/studentService'
import { getAllClasses } from '../services/classService'
import { getAttendanceForStudent } from '../services/attendanceService'

export default function StudentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [student, setStudent] = useState(null)
  const [classes, setClasses] = useState([])
  const [attendanceHistory, setAttendanceHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)

  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState('')
  const [studentId, setStudentId] = useState('')
  const [classId, setClassId] = useState('')
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState('')
  const [telegramId, setTelegramId] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [actionMessage, setActionMessage] = useState('')

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    setLoading(true)
    setError('')
    setNotFound(false)

    try {
      const [studentData, classList, history] = await Promise.all([
        getStudentById(id),
        getAllClasses(),
        getAttendanceForStudent(id),
      ])

      if (!studentData) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setStudent(studentData)
      setClasses(classList)
      setAttendanceHistory(history)
      populateForm(studentData)
    } catch (err) {
      setError('Failed to load student.')
    } finally {
      setLoading(false)
    }
  }

  function populateForm(studentData) {
    setName(studentData.name || '')
    setStudentId(studentData.studentId || '')
    setClassId(studentData.classId || '')
    setPhone(studentData.phone || '')
    setGender(studentData.gender || '')
    setTelegramId(studentData.telegramId || '')
  }

  function getClassName(classIdToFind) {
    const found = classes.find((c) => c.id === classIdToFind)
    return found ? found.name : '—'
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaveError('')

    if (!name.trim() || !studentId.trim()) {
      setSaveError('Name and Student ID are required.')
      return
    }

    setSaving(true)

    try {
      await updateStudent(id, {
        name: name.trim(),
        studentId: studentId.trim(),
        classId: classId || null,
        phone: phone.trim(),
        gender,
      })

      if (telegramId.trim() !== (student.telegramId || '')) {
        await linkTelegramId(id, telegramId.trim() || null)
      }

      setActionMessage('Student updated successfully.')
      setIsEditing(false)
      loadData()
    } catch (err) {
      setSaveError('Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleStatus() {
    setActionMessage('')

    try {
      if (student.status === 'active') {
        await deactivateStudent(id)
      } else {
        await activateStudent(id)
      }
      loadData()
    } catch (err) {
      setError('Failed to update status.')
    }
  }

  function handleRegenerateQr() {
    setActionMessage(
      'QR regeneration requires the backend function, which we will connect in Step 14.'
    )
  }

  if (loading) {
    return <p className="text-slate-500">Loading student...</p>
  }

  if (notFound) {
    return (
      <div>
        <p className="text-red-600 mb-4">Student not found.</p>
        <Link to="/students" className="text-blue-600 hover:text-blue-700">
          &larr; Back to Students
        </Link>
      </div>
    )
  }

  if (error) {
    return <p className="text-red-600">{error}</p>
  }

  return (
    <div>
      <Link to="/students" className="text-blue-600 hover:text-blue-700 text-sm">
        &larr; Back to Students
      </Link>

      <div className="flex items-center justify-between mt-3 mb-6">
        <h2 className="text-2xl font-bold text-slate-800">{student.name}</h2>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            student.status === 'active'
              ? 'bg-green-100 text-green-700'
              : 'bg-slate-100 text-slate-500'
          }`}
        >
          {student.status}
        </span>
      </div>

      {actionMessage && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2 mb-4">
          {actionMessage}
        </p>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Details</h3>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Edit
            </button>
          )}
        </div>

        {!isEditing && (
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-slate-500">Student ID</dt>
              <dd className="text-slate-800 font-medium">{student.studentId}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Class</dt>
              <dd className="text-slate-800 font-medium">
                {getClassName(student.classId)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Phone</dt>
              <dd className="text-slate-800 font-medium">{student.phone || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Gender</dt>
              <dd className="text-slate-800 font-medium">{student.gender || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Telegram ID</dt>
              <dd className="text-slate-800 font-medium">
                {student.telegramId || 'Not linked'}
              </dd>
            </div>
          </dl>
        )}

        {isEditing && (
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Student ID
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Class
              </label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No Class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Not specified</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Telegram ID (manual link)
              </label>
              <input
                type="text"
                placeholder="e.g. 123456789"
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {saveError && <p className="text-sm text-red-600">{saveError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false)
                  populateForm(student)
                  setSaveError('')
                }}
                className="px-4 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6 flex flex-wrap gap-3">
        <button
          onClick={handleToggleStatus}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            student.status === 'active'
              ? 'bg-red-50 text-red-600 hover:bg-red-100'
              : 'bg-green-50 text-green-700 hover:bg-green-100'
          }`}
        >
          {student.status === 'active' ? 'Deactivate Student' : 'Activate Student'}
        </button>

        <button
          onClick={handleRegenerateQr}
          className="px-4 py-2 rounded-md text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200"
        >
          Regenerate QR Code
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-slate-800 mb-4">Attendance History</h3>

        {attendanceHistory.length === 0 && (
          <p className="text-slate-500 text-sm">No attendance records yet.</p>
        )}

        {attendanceHistory.length > 0 && (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Entry</th>
                <th className="px-3 py-2">Exit</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attendanceHistory.map((record) => (
                <tr key={record.id}>
                  <td className="px-3 py-2">{record.date}</td>
                  <td className="px-3 py-2">
                    {record.entryTime
                      ? record.entryTime.toDate().toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </td>
                  <td className="px-3 py-2">
                    {record.exitTime
                      ? record.exitTime.toDate().toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </td>
                  <td className="px-3 py-2 capitalize">{record.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}