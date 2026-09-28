import { useEffect, useState } from 'react'
import QrScanner from '../components/QrScanner'
import { callRecordEntry, callRecordExit } from '../services/attendanceService'
import { getAllClasses } from '../services/classService'
import AttendanceTable from '../components/AttendanceTable'
// TEMPORARY STUB — replaced in Step 17 with a real Cloud Function call.
// Do not build real attendance logic here; this only exists so the UI
// can be tested before the secure backend is connected.

async function validateAndRecordAttendance(qrText, mode, classesCache) {
  try {
    const response =
      mode === 'entry'
        ? await callRecordEntry(qrText)
        : await callRecordExit(qrText)

    if (!response.student) {
      return { success: response.success, result: response.result, message: getFallbackMessage(response.result) }
    }

    const classItem = classesCache.find((c) => c.id === response.student.classId)

    return {
      success: response.success,
      result: response.result,
      student: {
        name: response.student.name,
        className: classItem ? classItem.name : 'No Class',
      },
      time: new Date(),
    }
  } catch (err) {
    return {
      success: false,
      result: 'ERROR',
      message: err.message || 'Failed to process scan.',
    }
  }
}

function getFallbackMessage(result) {
  if (result === 'STUDENT_INACTIVE') return 'This student is not active.'
  if (result === 'INVALID_QR') return 'Not a valid attendance QR code.'
  return 'Something went wrong.'
}

const RESULT_STYLES = {
  ENTRY_RECORDED: { icon: '✅', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  EXIT_RECORDED: { icon: '✅', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  ALREADY_ENTERED: { icon: '⚠️', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  ALREADY_EXITED: { icon: '⚠️', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  NO_ENTRY_FOUND: { icon: '⚠️', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  INVALID_QR: { icon: '❌', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  ERROR: { icon: '❌', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
}

const RESULT_LABELS = {
  ENTRY_RECORDED: 'ENTRY RECORDED',
  EXIT_RECORDED: 'EXIT RECORDED',
  ALREADY_ENTERED: 'ALREADY ENTERED TODAY',
  ALREADY_EXITED: 'ALREADY EXITED TODAY',
  NO_ENTRY_FOUND: 'NO ENTRY FOUND FOR TODAY',
  INVALID_QR: 'INVALID QR CODE',
  ERROR: 'SOMETHING WENT WRONG',
}

export default function Attendance() {
  const [mode, setMode] = useState('entry')
  const [scannerActive, setScannerActive] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [lastResult, setLastResult] = useState(null)
  const [classes, setClasses] = useState([])
  const [activeTab, setActiveTab] = useState('scanner')
  useEffect(() => {
    getAllClasses().then(setClasses).catch(() => setClasses([]))
  }, [])

  async function handleScan(decodedText) {
    if (processing) return

    setProcessing(true)
    setScannerActive(false)

    const response = await validateAndRecordAttendance(decodedText, mode, classes)
    setLastResult(response)
    setProcessing(false)
  }

  function handleModeChange(newMode) {
    setMode(newMode)
    setLastResult(null)
    setScannerActive(true)
  }

  function handleScanNext() {
    setLastResult(null)
    setScannerActive(true)
  }

  const resultStyle = lastResult ? RESULT_STYLES[lastResult.result] || RESULT_STYLES.ERROR : null
  const resultLabel = lastResult ? RESULT_LABELS[lastResult.result] || 'UNKNOWN RESULT' : ''

  return (
    <div>
=      <h2 className="text-2xl font-bold text-slate-800 mb-6">Attendance</h2>

      <div className="flex gap-2 mb-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('scanner')}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === 'scanner'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Scanner
        </button>
        <button
          onClick={() => setActiveTab('records')}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === 'records'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Records
        </button>
      </div>

      {activeTab === 'records' && <AttendanceTable />}

      {activeTab === 'scanner' && (
        <>
      <div className="flex justify-center gap-2 mb-6">
        <button
          onClick={() => handleModeChange('entry')}
          className={`px-6 py-2 rounded-md text-sm font-semibold ${
            mode === 'entry'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-slate-600 border border-slate-300'
          }`}
        >
          ENTRY
        </button>
        <button
          onClick={() => handleModeChange('exit')}
          className={`px-6 py-2 rounded-md text-sm font-semibold ${
            mode === 'exit'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-slate-600 border border-slate-300'
          }`}
        >
          EXIT
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {scannerActive && !lastResult && (
          <>
            <p className="text-center text-slate-500 text-sm mb-4">
              Scan Student QR Code — Mode: <span className="font-semibold uppercase">{mode}</span>
            </p>
            <QrScanner onScan={handleScan} active={scannerActive} />
          </>
        )}

        {processing && (
          <p className="text-center text-slate-500 mt-4">Processing...</p>
        )}

        {lastResult && !processing && (
          <div className={`border rounded-lg p-6 text-center ${resultStyle.bg}`}>
            <p className={`text-2xl mb-2 ${resultStyle.color}`}>{resultStyle.icon}</p>
            <p className={`text-lg font-bold mb-3 ${resultStyle.color}`}>{resultLabel}</p>

            {lastResult.success && lastResult.student && (
              <div className="text-slate-700 mb-4">
                <p className="font-semibold">{lastResult.student.name}</p>
                <p className="text-sm">{lastResult.student.className}</p>
                <p className="text-sm mt-1">
                  {lastResult.time.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            )}

            {!lastResult.success && (
              <p className="text-sm text-slate-600 mb-4">{lastResult.message}</p>
            )}

            <button
              onClick={handleScanNext}
              className="bg-blue-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Scan Next Student
            </button>
          </div>
             )}
      </div>
        </>
      )}
    </div>
  )
}