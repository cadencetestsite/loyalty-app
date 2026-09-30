"use client"

import { useState, useEffect, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function StaffScanPage() {
  const [scanning, setScanning] = useState(false)
  const [customerQr, setCustomerQr] = useState('')
  const [businessId, setBusinessId] = useState('')
  const [staffId, setStaffId] = useState('')
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadStaffData()
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear()
      }
    }
  }, [])

  const loadStaffData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: staffData } = await supabase
      .from('staff')
      .select('id, business_id')
      .eq('user_id', user.id)
      .single()

    if (staffData) {
      setStaffId(staffData.id)
      setBusinessId(staffData.business_id)
    }
  }

  const startScanner = () => {
    setScanning(true)
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    )

    scanner.render(onScanSuccess, onScanError)
    scannerRef.current = scanner
  }

  const onScanSuccess = (decodedText: string) => {
    setCustomerQr(decodedText)
    setScanning(false)
    if (scannerRef.current) {
      scannerRef.current.clear()
    }
  }

  const onScanError = (error: string) => {
    // Ignore errors, they're common during scanning
  }

  const addStamp = async () => {
    if (!customerQr || !businessId || !staffId) {
      toast.error('Missing information')
      return
    }

    // Find customer by QR code
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('qr_code', customerQr)
      .eq('business_id', businessId)
      .single()

    if (customerError || !customer) {
      toast.error('Customer not found')
      return
    }

    // Add stamp
    const { error: stampError } = await supabase
      .from('stamps')
      .insert({
        business_id: businessId,
        customer_id: customer.id,
        staff_id: staffId,
      })

    if (stampError) {
      toast.error(stampError.message)
    } else {
      toast.success('Stamp added!')
      setCustomerQr('')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold">Staff Scanner</h1>
            <button
              onClick={() => router.push('/staff/redeem')}
              className="text-blue-600 hover:underline"
            >
              Redeem Voucher
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Scan Customer QR Code</h2>

          {!scanning && !customerQr && (
            <button
              onClick={startScanner}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
            >
              Start Scanning
            </button>
          )}

          {scanning && (
            <div id="qr-reader" className="w-full max-w-md mx-auto"></div>
          )}

          {customerQr && (
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-800">Customer QR detected!</p>
                <p className="text-sm text-green-600 font-mono">{customerQr}</p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={addStamp}
                  className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700"
                >
                  Add Stamp
                </button>
                <button
                  onClick={() => {
                    setCustomerQr('')
                    setScanning(false)
                  }}
                  className="bg-gray-300 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Manual Entry</h3>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Enter customer QR code manually"
              value={customerQr}
              onChange={(e) => setCustomerQr(e.target.value)}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2"
            />
            <button
              onClick={addStamp}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Add Stamp
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
