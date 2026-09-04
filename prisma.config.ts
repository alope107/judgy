import { defineConfig } from 'prisma/config'

import { databaseUrl } from './src/keystone/database-url'

// Prisma 7 requires this file; Keystone 8 will scaffold a default one at the repo root if
// it is missing. Written by hand instead so the paths line up with `db.prismaSchemaPath`
// in src/keystone/config.ts rather than Keystone's root-level defaults.
export default defineConfig({
  schema: 'src/keystone/schema.prisma',
  migrations: {
    path: 'src/keystone/migrations',
  },
  datasource: {
    // Same URL the Keystone runtime uses. Local development only, never production.
    url: databaseUrl,
  },
})
