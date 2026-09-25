import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllClasses, createClass, updateClass, setClassActive } from '../services/classService'
import ClassFormModal from '../components/ClassFormModal'

export default function Classes() {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingClass, setEditingClass] = useState(null)

  useEffect(() => {
    loadClasses()
  }, [])

  async function loadClasses() {
    setLoading(true)
    setError('')

    try {
      const list = await getAllClasses()
      setClasses(list)
    } catch (err) {
      setError('Failed to load classes.')
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleActive(classItem) {
    try {
      await setClassActive(classItem.id, !classItem.active)
      loadClasses()
    } catch (err) {
      setError('Failed to update class status.')
    }
  }

  function openCreateForm() {
    setEditingClass(null)
    setShowForm(true)
  }

  function openEditForm(classItem) {
    setEditingClass(classItem)
    setShowForm(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Classes</h2>
        <button
          onClick={openCreateForm}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
        >
          + Add Class
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {loading && <p className="text-slate-500 p-4">Loading classes...</p>}
        {error && <p className="text-red-600 p-4">{error}</p>}

        {!loading && !error && classes.length === 0 && (
          <p className="text-slate-500 p-4">No classes yet. Create one to get started.</p>
        )}

        {!loading && !error && classes.length > 0 && (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Description</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classes.map((classItem) => (
                <tr key={classItem.id}>
                  <td className="px-4 py-2 font-medium text-slate-800">
                    {classItem.name}
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {classItem.description || '—'}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        classItem.active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {classItem.active ? 'active' : 'inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right space-x-3">
                    <Link
                      to={`/classes/${classItem.id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View Students
                    </Link>
                    <button
                      onClick={() => openEditForm(classItem)}
                      className="text-slate-600 hover:text-slate-800 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleActive(classItem)}
                      className={
                        classItem.active
                          ? 'text-red-600 hover:text-red-700 font-medium'
                          : 'text-green-700 hover:text-green-800 font-medium'
                      }
                    >
                      {classItem.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <ClassFormModal
          existingClass={editingClass}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false)
            loadClasses()
          }}
        />
      )}
    </div>
  )
}

