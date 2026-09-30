"use client"

import { useState, useEffect, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function JoinBusinessPage() {
  const [scanning, setScanning] = useState(false)
  const [businessQr, setBusinessQr] = useState('')
  const [loading, setLoading] = useState(false)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear()
      }
    }
  }, [])

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
    // Expected format: "BUSINESS:uuid-here"
    if (decodedText.startsWith('BUSINESS:')) {
      setBusinessQr(decodedText.replace('BUSINESS:', ''))
      setScanning(false)
      if (scannerRef.current) {
        scannerRef.current.clear()
      }
    } else {
      toast.error('Invalid business QR code')
    }
  }

  const onScanError = (error: string) => {
    // Ignore errors
  }

  const joinBusiness = async () => {
    if (!businessQr) {
      toast.error('Please scan a business QR code')
      return
    }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Verify business exists
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name')
      .eq('id', businessQr)
      .single()

    if (businessError || !business) {
      toast.error('Business not found')
      setLoading(false)
      return
    }

    // Check if already enrolled
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', user.id)
      .eq('business_id', business.id)
      .single()

    if (existing) {
      toast.success('Already enrolled in this program!')
      router.push('/customer')
      return
    }

    // Create customer profile
    const { error: joinError } = await supabase
      .from('customers')
      .insert({
        business_id: business.id,
        user_id: user.id,
        qr_code: `CUST:${user.id}:${business.id}`,
      })

    if (joinError) {
      toast.error(joinError.message)
    } else {
      toast.success(`Welcome to ${business.name}!`)
      router.push('/customer')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white shadow rounded-lg p-8 max-w-md w-full mx-4">
        <h1 className="text-2xl font-bold mb-6 text-center">Join a Loyalty Program</h1>

        <p className="text-gray-600 mb-6 text-center">
          Scan the QR code at a participating business to start collecting stamps.
        </p>

        {!scanning && !businessQr && (
          <button
            onClick={startScanner}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700"
          >
            Scan Business QR Code
          </button>
        )}

        {scanning && (
          <div id="qr-reader" className="w-full"></div>
        )}

        {businessQr && (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800 font-medium">Business QR detected!</p>
              <p className="text-sm text-green-600 font-mono break-all">{businessQr}</p>
            </div>

            <button
              onClick={joinBusiness}
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Joining...' : 'Join Program'}
            </button>

            <button
              onClick={() => {
                setBusinessQr('')
                setScanning(false)
              }}
              className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-300"
            >
              Scan Again
            </button>
          </div>
        )}

        <div className="mt-6 pt-6 border-t">
          <p className="text-sm text-gray-500 text-center">
            Don't have a QR code?{' '}
            <Link href="/customer" className="text-blue-600 hover:underline">
              Go to my card
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
