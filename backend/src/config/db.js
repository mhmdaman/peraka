const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Optional: you can test connection manually if needed
prisma.$connect()
  .then(() => console.log('✅ Prisma connected to PostgreSQL (Supabase) via pg adapter'))
  .catch((err) => console.error('❌ Prisma connection failed:', err.message));

module.exports = prisma;
