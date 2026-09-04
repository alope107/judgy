import 'dotenv/config'

// Single source of the database connection string, shared by the Keystone runtime
// (src/keystone/config.ts) and the Prisma CLI (prisma.config.ts). One copy means the
// server and the migration tool cannot drift onto different databases.
const DEFAULT_LOCAL_DATABASE_URL = 'postgres://judgy:judgy@localhost:5432/judgy'

function resolveDatabaseUrl(): string {
  const fromEnv = process.env.DATABASE_URL?.trim()
  if (fromEnv) return fromEnv

  // A missing DATABASE_URL outside local development is a misconfiguration, not something
  // to paper over. Falling back would quietly point a deployed process at a database that
  // does not exist — or worse, at whatever happens to be listening on localhost:5432.
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'DATABASE_URL is not set. Refusing to fall back to the local development database ' +
        'in production. Set DATABASE_URL to the intended PostgreSQL instance.'
    )
  }

  // Local development is allowed to work with no setup — docs/BOOTSTRAP.md requires a
  // clean clone to run with no .env — but it says so rather than pretending it was
  // configured. Silence here is what turns "wrong database" into a debugging session.
  console.warn(
    `[judgy] DATABASE_URL is not set; using the local development default ` +
      `(${DEFAULT_LOCAL_DATABASE_URL}). Set DATABASE_URL to override.`
  )
  return DEFAULT_LOCAL_DATABASE_URL
}

export const databaseUrl = resolveDatabaseUrl()
