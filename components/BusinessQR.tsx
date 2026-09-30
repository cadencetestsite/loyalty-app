"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { QRCodeSVG } from 'qrcode.react'

export default function BusinessQR() {
  const [business, setBusiness] = useState<{ id: string; name: string; qr_code: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadBusiness()
  }, [])

  const loadBusiness = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('businesses')
      .select('id, name, qr_code')
      .eq('owner_id', user.id)
      .single()

    if (data) setBusiness(data)
  }

  if (!business) return null

  return (
    <div className="bg-white shadow rounded-lg p-6 text-center">
      <h3 className="text-lg font-medium mb-4">Your Business QR Code</h3>
      <p className="text-sm text-gray-600 mb-4">
        Print this and display it for customers to scan and join your program.
      </p>
      <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
        <QRCodeSVG value={business.qr_code} size={200} />
      </div>
      <p className="mt-4 text-xs text-gray-500 font-mono">{business.qr_code}</p>
    </div>
  )
}
