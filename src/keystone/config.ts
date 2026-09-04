import { config } from '@keystone-6/core'
import { PrismaPg } from '@prisma/adapter-pg'

import { databaseUrl } from './database-url'
import { lists } from './schema'

// Task 0 scaffolding only: an empty Keystone project on PostgreSQL, enough to prove the
// version set in package.json actually assembles and that a list round-trips through the
// Admin UI. No auth, no WebSocket wiring, no access control yet — those arrive with
// ADR-0007 and ADR-0008 in later bootstrap tasks.
export default config({
  db: {
    // ADR-0002: PostgreSQL everywhere. There is no SQLite fallback, not even for tests.
    provider: 'postgresql',

    // Keystone 8 removed `db.url`, and Prisma 7 removed `datasourceUrl`. The connection
    // now goes through a driver adapter, which is mandatory: the generated
    // `PrismaClientOptions` is a union of `{ adapter }` and `{ accelerateUrl }`, the
    // latter being Prisma's hosted Accelerate service. `PrismaPg` wraps the `pg` pool.
    //
    // Nearly every Keystone and Prisma tutorial still shows `db.url` or `datasourceUrl`;
    // both fail here, the first at type-check and the second only at runtime.
    // The Prisma CLI reads its own connection string from prisma.config.ts for migrations.
    prismaClientOptions: () => ({
      adapter: new PrismaPg({ connectionString: databaseUrl }),
    }),

    // ADR-0001: Keystone no longer creates or applies migrations; we drive Prisma
    // ourselves. Keeping the generated schema next to the lists that produce it means a
    // schema change and its migration show up in the same part of a diff.
    prismaSchemaPath: 'src/keystone/schema.prisma',
  },

  lists,

  // Generated artifacts. Both are committed so CI and review can see schema drift.
  types: { path: 'src/keystone/types.ts' },
  graphql: { schemaPath: 'src/keystone/schema.graphql' },

  // Keystone reports anonymous usage data on `keystone dev` by default. Off here: this
  // application will hold education records, and an outbound call we did not ask for is
  // not something to leave switched on by default. Nothing about it is load-bearing.
  telemetry: false,
})
