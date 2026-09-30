"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { QRCodeSVG } from 'qrcode.react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface CustomerData {
  id: string
  qr_code: string
  business_id: string
  businesses: {
    name: string
  }
}

interface StampCount {
  count: number
}

interface Voucher {
  id: string
  status: string
  rewards: {
    name: string
    description: string
  }
}

export default function CustomerPage() {
  const [customer, setCustomer] = useState<CustomerData | null>(null)
  const [stampCount, setStampCount] = useState(0)
  const [nextReward, setNextReward] = useState<{ name: string; stamps_required: number } | null>(null)
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadCustomerData()
  }, [])

  const loadCustomerData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Get customer profile
    const { data: customerData } = await supabase
      .from('customers')
      .select('*, businesses(name)')
      .eq('user_id', user.id)
      .single()

    if (!customerData) {
      setLoading(false)
      return
    }

    setCustomer(customerData)

    // Get stamp count
    const { count } = await supabase
      .from('stamps')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', customerData.id)

    setStampCount(count || 0)

    // Get next reward (lowest stamps_required that's > current count)
    const { data: rewards } = await supabase
      .from('rewards')
      .select('name, stamps_required')
      .eq('business_id', customerData.business_id)
      .gt('stamps_required', count || 0)
      .order('stamps_required')
      .limit(1)

    if (rewards && rewards.length > 0) {
      setNextReward(rewards[0])
    }

    // Get active vouchers
    const { data: vouchersData } = await supabase
      .from('vouchers')
      .select('*, rewards(name, description)')
      .eq('customer_id', customerData.id)
      .eq('status', 'active')

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

  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Not enrolled in any loyalty program</h2>
          <p className="text-gray-600 mb-4">
            Ask a business for their QR code to join their program.
          </p>
        </div>
      </div>
    )
  }

  const progress = nextReward 
    ? Math.min((stampCount / nextReward.stamps_required) * 100, 100)
    : 100

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold">{customer.businesses?.name}</h1>
            <Link href="/customer/vouchers" className="text-blue-600 hover:underline">
              My Vouchers ({vouchers.length})
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <h2 className="text-lg font-medium mb-4">Your QR Code</h2>
          <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
            <QRCodeSVG value={customer.qr_code} size={200} />
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Show this to staff to collect stamps
          </p>
        </div>

        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium">Stamp Progress</h3>
            <span className="text-2xl font-bold text-blue-600">
              {stampCount} {nextReward ? `/ ${nextReward.stamps_required}` : ''}
            </span>
          </div>

          {nextReward ? (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Next reward: {nextReward.name}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-blue-600 h-4 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </>
          ) : (
            <p className="text-green-600 font-medium">
              🎉 You've earned all available rewards!
            </p>
          )}
        </div>

        {vouchers.length > 0 && (
          <div className="mt-6 bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Active Vouchers</h3>
            <div className="space-y-3">
              {vouchers.map((voucher) => (
                <div
                  key={voucher.id}
                  className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-green-800">
                      {voucher.rewards?.name}
                    </p>
                    <p className="text-sm text-green-600">
                      {voucher.rewards?.description}
                    </p>
                  </div>
                  <Link
                    href={`/customer/vouchers?voucher=${voucher.id}`}
                    className="text-green-700 hover:underline text-sm"
                  >
                    Show QR
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
