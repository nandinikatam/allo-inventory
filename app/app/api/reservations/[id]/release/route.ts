import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params

  const reservation = await prisma.reservation.findUnique({
    where: { id }
  })

  if (!reservation) {
    return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
  }

  if (reservation.status !== 'PENDING') {
    return NextResponse.json({ error: 'Reservation is not pending' }, { status: 400 })
  }

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
      where: { id },
      data: { status: 'RELEASED' }
    })
  ])

  return NextResponse.json({ success: true, status: 'RELEASED' })
}