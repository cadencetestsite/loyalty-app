"use client"

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

type Role = 'business' | 'customer'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [role, setRole] = useState<Role>('customer')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    if (role === 'business') {
      // Create business
      const { error: businessError } = await supabase
        .from('businesses')
        .insert({
          name: businessName,
          owner_id: data.user?.id,
        })

      if (businessError) {
        toast.error(businessError.message)
        setLoading(false)
        return
      }

      router.push('/admin')
    } else {
      // Create customer profile (will be linked to business later via QR)
      // For MVP, customers need to scan a business QR or enter code
      toast.success('Account created! Ask business for their QR code to join.')
      router.push('/customer')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <div>
          <h2 className="text-3xl font-bold text-center">Create account</h2>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            type="button"
            onClick={() => setRole('customer')}
            className={`px-4 py-2 rounded ${
              role === 'customer' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Customer
          </button>
          <button
            type="button"
            onClick={() => setRole('business')}
            className={`px-4 py-2 rounded ${
              role === 'business' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Business
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          {role === 'business' && (
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium">
                Business Name
              </label>
              <input
                id="businessName"
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
