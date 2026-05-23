import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const body = await request.json()
  const { productId, warehouseId, quantity } = body

  if (!productId || !warehouseId || !quantity) {
    return NextResponse.json(
      { error: 'productId, warehouseId and quantity are required' },
      { status: 400 }
    )
  }

  try {
    const reservation = await prisma.$transaction(async (tx) => {
      // Lock the inventory row to prevent race conditions
      const inventory = await tx.$queryRaw<any[]>`
        SELECT * FROM "Inventory"
        WHERE "productId" = ${productId}
        AND "warehouseId" = ${warehouseId}
        FOR UPDATE
      `

      if (!inventory || inventory.length === 0) {
        throw new Error('INVENTORY_NOT_FOUND')
      }

      const inv = inventory[0]
      const available = inv.totalUnits - inv.reservedUnits

      if (available < quantity) {
        throw new Error('INSUFFICIENT_STOCK')
      }

      // Reserve the units
      await tx.inventory.update({
        where: {
          productId_warehouseId: { productId, warehouseId }
        },
        data: {
          reservedUnits: { increment: quantity }
        }
      })

      // Create reservation with 10 minute expiry
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
      const newReservation = await tx.reservation.create({
        data: {
          productId,
          warehouseId,
          quantity,
          status: 'PENDING',
          expiresAt,
        }
      })

      return newReservation
    })

    return NextResponse.json(reservation, { status: 201 })

  } catch (error: any) {
    if (error.message === 'INSUFFICIENT_STOCK') {
      return NextResponse.json(
        { error: 'Not enough stock available' },
        { status: 409 }
      )
    }
    if (error.message === 'INVENTORY_NOT_FOUND') {
      return NextResponse.json(
        { error: 'Inventory not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}