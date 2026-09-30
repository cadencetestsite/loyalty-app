"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { QRCodeSVG } from 'qrcode.react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Voucher {
  id: string
  qr_code: string
  status: string
  created_at: string
  rewards: {
    name: string
    description: string
  }
}

export default function CustomerVouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadVouchers()
  }, [])

  const loadVouchers = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!customer) {
      setLoading(false)
      return
    }

    const { data: vouchersData } = await supabase
      .from('vouchers')
      .select('*, rewards(name, description)')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })

    if (vouchersData) setVouchers(vouchersData)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (selectedVoucher) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white shadow rounded-lg p-8 text-center max-w-sm w-full mx-4">
          <h2 className="text-xl font-bold mb-2">{selectedVoucher.rewards?.name}</h2>
          <p className="text-gray-600 mb-6">{selectedVoucher.rewards?.description}</p>

          <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
            <QRCodeSVG value={selectedVoucher.qr_code} size={250} />
          </div>

          <p className="mt-4 text-sm text-gray-500">
            Show this to staff to redeem
          </p>

          <button
            onClick={() => setSelectedVoucher(null)}
            className="mt-6 w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300"
          >
            Back to Vouchers
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold">My Vouchers</h1>
            <Link href="/customer" className="text-blue-600 hover:underline">
              Back to Card
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {vouchers.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-gray-500">No vouchers yet. Keep collecting stamps!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {vouchers.map((voucher) => (
              <div
                key={voucher.id}
                className={`bg-white shadow rounded-lg p-6 ${
                  voucher.status === 'redeemed' ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{voucher.rewards?.name}</h3>
                    <p className="text-sm text-gray-500">
                      {voucher.rewards?.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Earned: {new Date(voucher.created_at).toLocaleDateString()}
                    </p>
                    <span
                      className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
                        voucher.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : voucher.status === 'redeemed'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {voucher.status}
                    </span>
                  </div>

                  {voucher.status === 'active' && (
                    <button
                      onClick={() => setSelectedVoucher(voucher)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      Show QR
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
