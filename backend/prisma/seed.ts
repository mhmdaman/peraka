import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // Seed roles
  const roles = [
    { name: 'admin', description: 'Full system control, HR operations, and financial auditing.' },
    { name: 'manager', description: 'Team supervision, leave reviews, and task management.' },
    { name: 'employee', description: 'Standard access for leaves, attendance, profile, and payslips.' },
  ]

  for (const r of roles) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: r,
    })
  }

  // Get admin role id
  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } })
  
  if (adminRole) {
    // Seed admin user
    const passwordHash = await bcrypt.hash('Admin@123', 10)
    
    await prisma.employee.upsert({
      where: { email: 'admin@company.com' },
      update: {},
      create: {
        first_name: 'Admin',
        last_name: 'User',
        email: 'admin@company.com',
        password_hash: passwordHash,
        phone: '9876543210',
        job_title: 'System Administrator',
        date_of_joining: new Date('2024-01-01'),
        status: 'active',
        role_id: adminRole.id,
        salary_base: 80000.00,
      }
    })
  }

  console.log('Database seeded successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
