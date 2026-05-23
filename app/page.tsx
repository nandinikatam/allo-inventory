'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Inventory {
  id: string
  totalUnits: number
  reservedUnits: number
  warehouse: { id: string; name: string; location: string }
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  inventories: Inventory[]
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [reserving, setReserving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(data => { setProducts(data); setLoading(false) })
  }, [])

  async function handleReserve(productId: string, warehouseId: string) {
    setReserving(productId + warehouseId)
    setError(null)
    const res = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, warehouseId, quantity: 1 })
    })
    const data = await res.json()
    if (res.status === 409) {
      setError('Not enough stock available!')
      setReserving(null)
      return
    }
    if (!res.ok) {
      setError('Something went wrong. Try again.')
      setReserving(null)
      return
    }
    router.push(`/reservation/${data.id}`)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500 text-lg">Loading products...</p>
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Allo Inventory</h1>
      <p className="text-gray-500 mb-8">Reserve products before checkout</p>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <div key={product.id} className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800">{product.name}</h2>
            <p className="text-gray-500 text-sm mt-1">{product.description}</p>
            <p className="text-2xl font-bold text-green-600 mt-3">
              ₹{product.price.toLocaleString()}
            </p>

            <div className="mt-4 space-y-3">
              {product.inventories.map(inv => {
                const available = inv.totalUnits - inv.reservedUnits
                const isBusy = reserving === product.id + inv.warehouse.id
                return (
                  <div key={inv.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-700">{inv.warehouse.name}</p>
                        <p className="text-sm text-gray-400">{inv.warehouse.location}</p>
                        <p className={`text-sm font-semibold mt-1 ${available > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {available > 0 ? `${available} units available` : 'Out of stock'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleReserve(product.id, inv.warehouse.id)}
                        disabled={available === 0 || isBusy}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {isBusy ? 'Reserving...' : 'Reserve'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}