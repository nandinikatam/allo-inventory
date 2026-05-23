import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const expiredReservations = await prisma.reservation.findMany({
    where: {
      status: 'PENDING',
      expiresAt: { lt: new Date() }
    }
  })

  for (const reservation of expiredReservations) {
    await prisma.$transaction([
      prisma.inventory.update({
        where: {
          productId_warehouseId: {
            productId: reservation.productId,
            warehouseId: reservation.warehouseId,
          }
        },
        data: { reservedUnits: { decrement: reservation.quantity } }
      }),
      prisma.reservation.update({
        where: { id: reservation.id },
        data: { status: 'RELEASED' }
      })
    ])
  }

  return NextResponse.json({ released: expiredReservations.length })
}