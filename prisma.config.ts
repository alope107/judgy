import 'dotenv/config'

import { defineConfig } from 'prisma/config'

// Prisma 7 requires this file; Keystone 8 will scaffold a default one at the repo root if
// it is missing. Written by hand instead so the paths line up with `db.prismaSchemaPath`
// in src/keystone/config.ts rather than Keystone's root-level defaults.
export default defineConfig({
  schema: 'src/keystone/schema.prisma',
  migrations: {
    path: 'src/keystone/migrations',
  },
  datasource: {
    // Local development only. Never a production host (CLAUDE.md).
    url: process.env.DATABASE_URL,
  },
})
