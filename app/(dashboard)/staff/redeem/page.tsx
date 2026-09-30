"use client"

import { useState, useEffect, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function StaffRedeemPage() {
  const [scanning, setScanning] = useState(false)
  const [voucherQr, setVoucherQr] = useState('')
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
    setVoucherQr(decodedText)
    setScanning(false)
    if (scannerRef.current) {
      scannerRef.current.clear()
    }
  }

  const onScanError = (error: string) => {
    // Ignore errors
  }

  const redeemVoucher = async () => {
    if (!voucherQr || !staffId) {
      toast.error('Missing information')
      return
    }

    // Find voucher by QR code
    const { data: voucher, error: voucherError } = await supabase
      .from('vouchers')
      .select('id, status')
      .eq('qr_code', voucherQr)
      .eq('business_id', businessId)
      .single()

    if (voucherError || !voucher) {
      toast.error('Voucher not found')
      return
    }

    if (voucher.status !== 'active') {
      toast.error('Voucher already redeemed or expired')
      return
    }

    // Mark as redeemed
    const { error: redeemError } = await supabase
      .from('vouchers')
      .update({
        status: 'redeemed',
        redeemed_at: new Date().toISOString(),
        redeemed_by: staffId,
      })
      .eq('id', voucher.id)

    if (redeemError) {
      toast.error(redeemError.message)
    } else {
      toast.success('Voucher redeemed!')
      setVoucherQr('')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold">Redeem Voucher</h1>
            <button
              onClick={() => router.push('/staff/scan')}
              className="text-blue-600 hover:underline"
            >
              Scan for Stamps
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Scan Voucher QR Code</h2>

          {!scanning && !voucherQr && (
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

          {voucherQr && (
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-blue-800">Voucher QR detected!</p>
                <p className="text-sm text-blue-600 font-mono">{voucherQr}</p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={redeemVoucher}
                  className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700"
                >
                  Redeem Voucher
                </button>
                <button
                  onClick={() => {
                    setVoucherQr('')
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
              placeholder="Enter voucher code manually"
              value={voucherQr}
              onChange={(e) => setVoucherQr(e.target.value)}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2"
            />
            <button
              onClick={redeemVoucher}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Redeem
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
