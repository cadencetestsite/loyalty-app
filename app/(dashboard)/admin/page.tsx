import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import BusinessQR from '@/components/BusinessQR'

export default async function AdminDashboard() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!business) redirect('/register')

  // Get stats
  const { data: customers } = await supabase
    .from('customers')
    .select('id')
    .eq('business_id', business.id)

  const { data: stamps } = await supabase
    .from('stamps')
    .select('id')
    .eq('business_id', business.id)

  const { data: vouchers } = await supabase
    .from('vouchers')
    .select('id, status')
    .eq('business_id', business.id)

  const redeemedVouchers = vouchers?.filter(v => v.status === 'redeemed').length || 0

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold">{business.name}</h1>
            <div className="flex gap-4">
              <Link href="/admin/rewards" className="text-blue-600 hover:underline">
                Rewards
              </Link>
              <Link href="/admin/staff" className="text-blue-600 hover:underline">
                Staff
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Customers</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {customers?.length || 0}
            </dd>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Stamps Issued</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {stamps?.length || 0}
            </dd>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Active Vouchers</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {vouchers?.filter(v => v.status === 'active').length || 0}
            </dd>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Redeemed</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {redeemedVouchers}
            </dd>
          </div>
        </div>

        <div className="mt-8">
          <BusinessQR />
        </div>

        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Stamp Reset Policy</h2>
          <p className="text-gray-600 mb-4">
            Current policy: <strong>{business.stamp_reset_policy === 'reset_to_zero' ? 'Reset to zero' : 'Carry over remainder'}</strong>
          </p>
          <p className="text-sm text-gray-500">
            {business.stamp_reset_policy === 'reset_to_zero' 
              ? 'When a customer earns a reward, their stamp count resets to zero.'
              : 'When a customer earns a reward, only the stamps used for that reward are deducted.'}
          </p>
        </div>
      </main>
    </div>
  )
}
