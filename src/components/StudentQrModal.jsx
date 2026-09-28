import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

export default function StudentQrModal({ student, onClose }) {
  const [qrText, setQrText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  function handleGenerate() {
    setError('')
    setLoading(true)

    setQrText(student.studentId)
    setConfirmOpen(false)
    setLoading(false)
  }

  function handlePrint() {
    const printWindow = window.open('', '_blank')
    const svgElement = document.getElementById('student-qr-svg')

    if (!svgElement || !printWindow) return

    printWindow.document.write(`
      <html>
        <head><title>${student.name} - QR Code</title></head>
        <body style="text-align:center; font-family: sans-serif; padding: 40px;">
          <h2>${student.name}</h2>
          <p>${student.studentId}</p>
          ${svgElement.outerHTML}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800">QR Code</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none"
          >
            &times;
          </button>
        </div>

        <p className="text-sm text-slate-500 mb-4">
          {student.name} — {student.studentId}
        </p>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        {!qrText && !confirmOpen && (
          <button
            onClick={() => setConfirmOpen(true)}
            className="w-full bg-blue-600 text-white py-2 rounded-md text-sm font-medium hover:bg-blue-700"
          >
            {student.qrTokenHash ? 'Regenerate QR Code' : 'Generate QR Code'}
          </button>
        )}

        {!qrText && confirmOpen && (
          <div>
            {student.qrTokenHash && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-3">
                This will invalidate the student's current QR code. Continue?
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 px-4 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Generating...' : 'Confirm'}
              </button>
            </div>
          </div>
        )}

        {qrText && (
          <div>
            <div className="flex justify-center mb-4">
              <QRCodeSVG id="student-qr-svg" value={qrText} size={220} />
            </div>
            <p className="text-xs text-slate-400 mb-4">
              This QR code will not be shown again after closing. Print or save it now,
              or send it to the student via Telegram.
            </p>
            <button
              onClick={handlePrint}
              className="w-full bg-slate-100 text-slate-700 py-2 rounded-md text-sm font-medium hover:bg-slate-200"
            >
              Print QR Code
            </button>
          </div>
        )}
      </div>
    </div>
  )
}