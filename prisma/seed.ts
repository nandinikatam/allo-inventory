import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as dotenv from 'dotenv'

dotenv.config()

const pool = new Pool({ connectionString: process.env.DIRECT_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  // Create warehouses
  const mumbai = await prisma.warehouse.create({
    data: { name: 'Mumbai Warehouse', location: 'Mumbai, India' }
  })
  const delhi = await prisma.warehouse.create({
    data: { name: 'Delhi Warehouse', location: 'Delhi, India' }
  })

  // Create products
  const phone = await prisma.product.create({
    data: {
      name: 'Smartphone X1',
      description: 'Latest smartphone with great camera',
      price: 29999,
      inventories: {
        create: [
          { warehouseId: mumbai.id, totalUnits: 10 },
          { warehouseId: delhi.id, totalUnits: 5 },
        ]
      }
    }
  })

  const laptop = await prisma.product.create({
    data: {
      name: 'Laptop Pro 15',
      description: 'High performance laptop for professionals',
      price: 89999,
      inventories: {
        create: [
          { warehouseId: mumbai.id, totalUnits: 5 },
          { warehouseId: delhi.id, totalUnits: 3 },
        ]
      }
    }
  })

  const headphones = await prisma.product.create({
    data: {
      name: 'Wireless Headphones',
      description: 'Noise cancelling wireless headphones',
      price: 9999,
      inventories: {
        create: [
          { warehouseId: mumbai.id, totalUnits: 20 },
          { warehouseId: delhi.id, totalUnits: 15 },
        ]
      }
    }
  })

  console.log('✅ Seeded:', { phone, laptop, headphones })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())