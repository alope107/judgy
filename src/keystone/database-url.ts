import 'dotenv/config'

// Single source of the database connection string, shared by the Keystone runtime
// (src/keystone/config.ts) and the Prisma CLI (prisma.config.ts). One copy means the
// server and the migration tool cannot drift onto different databases.

function resolveDatabaseUrl(): string {
  const fromEnv = process.env.DATABASE_URL?.trim()
  if (fromEnv) return fromEnv

  // DATABASE_URL is required in all environments. A missing or empty connection string
  // is a misconfiguration. Falling back to a default would quietly point the process at
  // the wrong database — the worst kind of failure because it passes silently and data
  // corruption surfaces later. Fail loudly instead.
  throw new Error(
    'DATABASE_URL is not set. Copy .env.example to .env and populate it with your PostgreSQL connection string.'
  )
}

export const databaseUrl = resolveDatabaseUrl()
