"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface StaffMember {
  id: string
  user_id: string
  email?: string
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [email, setEmail] = useState('')
  const [businessId, setBusinessId] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadStaff()
  }, [])

  const loadStaff = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!business) return
    setBusinessId(business.id)

    const { data: staffData } = await supabase
      .from('staff')
      .select('*')
      .eq('business_id', business.id)

    if (staffData) setStaff(staffData)
  }

  const inviteStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Note: In production, you'd send an invitation email
    // For MVP, staff must register first, then you add them by email
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    // Look up user by email (this requires a service role key in production)
    // For MVP, we'll just show a message
    toast.success('Staff invitation feature: Have staff register, then add them manually in database for now.')
    setEmail('')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold">Manage Staff</h1>
            <button
              onClick={() => router.push('/admin')}
              className="text-blue-600 hover:underline"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium mb-4">Add Staff Member</h2>
          <form onSubmit={inviteStaff} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Staff Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="staff@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Staff'}
            </button>
          </form>
          <p className="mt-4 text-sm text-gray-500">
            Note: Staff must register an account first. Then you can add them here.
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Current Staff</h2>
          {staff.length === 0 ? (
            <p className="text-gray-500">No staff members yet.</p>
          ) : (
            <div className="space-y-4">
              {staff.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between border-b pb-4"
                >
                  <div>
                    <p className="font-medium">{member.email || member.user_id}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
