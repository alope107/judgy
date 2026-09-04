import 'dotenv/config'

// Single source of the local development connection string, shared by the Keystone
// runtime (src/keystone/config.ts) and the Prisma CLI (prisma.config.ts). Keeping one
// copy means the server and the migration tool cannot drift onto different databases.
//
// The fallback is the throwaway credential in docker-compose.yml and .env.example, so a
// clean clone works with no setup. It is not a secret and it is not a production host —
// per CLAUDE.md, neither may ever be committed. Deployments set DATABASE_URL.
export const DEFAULT_LOCAL_DATABASE_URL = 'postgres://judgy:judgy@localhost:5432/judgy'

export const databaseUrl = process.env.DATABASE_URL ?? DEFAULT_LOCAL_DATABASE_URL
