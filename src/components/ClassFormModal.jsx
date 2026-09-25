import { useState } from 'react'
import { createClass, updateClass } from '../services/classService'

export default function ClassFormModal({ existingClass, onClose, onSaved }) {
  const [name, setName] = useState(existingClass ? existingClass.name : '')
  const [description, setDescription] = useState(
    existingClass ? existingClass.description : ''
  )
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const isEditMode = Boolean(existingClass)

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    if (!name.trim()) {
      setFormError('Class name is required.')
      return
    }

    setSubmitting(true)

    try {
      if (isEditMode) {
        await updateClass(existingClass.id, {
          name: name.trim(),
          description: description.trim(),
        })
      } else {
        await createClass({
          name: name.trim(),
          description: description.trim(),
        })
      }
      onSaved()
    } catch (err) {
      setFormError('Failed to save class. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800">
            {isEditMode ? 'Edit Class' : 'Add Class'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Class Name
            </label>
            <input
              type="text"
              placeholder="e.g. Grade 10"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}