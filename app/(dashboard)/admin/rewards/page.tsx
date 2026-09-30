"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Reward {
  id: string
  name: string
  description: string
  stamps_required: number
}

export default function RewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [stampsRequired, setStampsRequired] = useState(5)
  const [businessId, setBusinessId] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadRewards()
  }, [])

  const loadRewards = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!business) return
    setBusinessId(business.id)

    const { data: rewardsData } = await supabase
      .from('rewards')
      .select('*')
      .eq('business_id', business.id)
      .order('stamps_required')

    if (rewardsData) setRewards(rewardsData)
  }

  const addReward = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase
      .from('rewards')
      .insert({
        business_id: businessId,
        name,
        description,
        stamps_required: stampsRequired,
      })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Reward added!')
      setName('')
      setDescription('')
      setStampsRequired(5)
      loadRewards()
    }
    setLoading(false)
  }

  const deleteReward = async (id: string) => {
    const { error } = await supabase
      .from('rewards')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Reward deleted')
      loadRewards()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold">Manage Rewards</h1>
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
          <h2 className="text-lg font-medium mb-4">Add New Reward</h2>
          <form onSubmit={addReward} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Reward Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="Free Coffee"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="Any regular size coffee"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Stamps Required</label>
              <input
                type="number"
                required
                min={1}
                value={stampsRequired}
                onChange={(e) => setStampsRequired(parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Reward'}
            </button>
          </form>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Current Rewards</h2>
          {rewards.length === 0 ? (
            <p className="text-gray-500">No rewards yet. Add your first reward above.</p>
          ) : (
            <div className="space-y-4">
              {rewards.map((reward) => (
                <div
                  key={reward.id}
                  className="flex items-center justify-between border-b pb-4"
                >
                  <div>
                    <h3 className="font-medium">{reward.name}</h3>
                    <p className="text-sm text-gray-500">{reward.description}</p>
                    <p className="text-sm text-blue-600">
                      {reward.stamps_required} stamps required
                    </p>
                  </div>
                  <button
                    onClick={() => deleteReward(reward.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
