import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

const SCANNER_ELEMENT_ID = 'qr-scanner-region'

export default function QrScanner({ onScan, active }) {
  const scannerRef = useRef(null)
  const isRunningRef = useRef(false)
  const [cameraError, setCameraError] = useState('')

  useEffect(() => {
    if (!active) {
      stopScanner()
      return
    }

    startScanner()

    return () => {
      stopScanner()
    }
  }, [active])

  async function startScanner() {
    setCameraError('')

    try {
      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID)
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          onScan(decodedText)
        },
        () => {
          // ignore per-frame "no QR found" errors, this fires constantly while scanning
        }
      )

      isRunningRef.current = true
    } catch (err) {
      setCameraError(
        'Unable to access camera. Please allow camera permission and try again.'
      )
    }
  }

  async function stopScanner() {
    if (scannerRef.current && isRunningRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
      } catch (err) {
        // scanner may already be stopped, safe to ignore
      }
      isRunningRef.current = false
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div
        id={SCANNER_ELEMENT_ID}
        className="w-full rounded-lg overflow-hidden bg-black aspect-square"
      />
      {cameraError && (
        <p className="text-sm text-red-600 mt-3 text-center">{cameraError}</p>
      )}
    </div>
  )
}