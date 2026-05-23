'use client'
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'

interface Reservation {
  id: string
  productId: string
  warehouseId: string
  quantity: number
  status: string
  expiresAt: string
  product: { name: string; price: number }
  warehouse: { name: string }
}

export default function ReservationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch(`/api/reservations/${id}`)
      .then(r => r.json())
      .then(data => {
        setReservation(data)
        setLoading(false)
      })
  }, [id])

  useEffect(() => {
    if (!reservation) return
    const interval = setInterval(() => {
      const left = new Date(reservation.expiresAt).getTime() - Date.now()
      setTimeLeft(Math.max(0, Math.floor(left / 1000)))
    }, 1000)
    return () => clearInterval(interval)
  }, [reservation])

  async function handleConfirm() {
    setActionLoading(true)
    const res = await fetch(`/api/reservations/${id}/confirm`, { method: 'POST' })
    const data = await res.json()
    if (res.status === 410) {
      setMessage({ text: 'Reservation expired! Stock has been released.', type: 'error' })
    } else if (res.ok) {
      setMessage({ text: '✅ Purchase confirmed! Thank you.', type: 'success' })
      setReservation(prev => prev ? { ...prev, status: 'CONFIRMED' } : null)
    } else {
      setMessage({ text: data.error || 'Something went wrong.', type: 'error' })
    }
    setActionLoading(false)
  }

  async function handleCancel() {
    setActionLoading(true)
    const res = await fetch(`/api/reservations/${id}/release`, { method: 'POST' })
    if (res.ok) {
      setMessage({ text: 'Reservation cancelled. Stock released.', type: 'error' })
      setReservation(prev => prev ? { ...prev, status: 'RELEASED' } : null)
    }
    setActionLoading(false)
  }

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Loading reservation...</p>
    </div>
  )

  if (!reservation) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-red-500">Reservation not found.</p>
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Checkout</h1>

        {message && (
          <div className={`px-4 py-3 rounded mb-6 ${message.type === 'success' ? 'bg-green-100 text-green-700 border border-green-400' : 'bg-red-100 text-red-700 border border-red-400'}`}>
            {message.text}
          </div>
        )}

        <div className="space-y-3 mb-6">
          <div className="flex justify-between">
            <span className="text-gray-500">Product</span>
            <span className="font-medium">{reservation.product?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Warehouse</span>
            <span className="font-medium">{reservation.warehouse?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Quantity</span>
            <span className="font-medium">{reservation.quantity}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Status</span>
            <span className={`font-semibold ${reservation.status === 'CONFIRMED' ? 'text-green-600' : reservation.status === 'RELEASED' ? 'text-red-500' : 'text-yellow-600'}`}>
              {reservation.status}
            </span>
          </div>
        </div>

        {reservation.status === 'PENDING' && (
          <>
            <div className={`text-center text-4xl font-mono font-bold mb-6 ${timeLeft < 60 ? 'text-red-500' : 'text-blue-600'}`}>
              {minutes}:{seconds.toString().padStart(2, '0')}
              <p className="text-sm font-normal text-gray-400 mt-1">time remaining</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleConfirm}
                disabled={actionLoading || timeLeft === 0}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Processing...' : 'Confirm Purchase'}
              </button>
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="w-full bg-red-100 text-red-600 py-3 rounded-lg font-semibold hover:bg-red-200 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {reservation.status !== 'PENDING' && (
          <button
            onClick={() => router.push('/')}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            Back to Products
          </button>
        )}
      </div>
    </main>
  )
}