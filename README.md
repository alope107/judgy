# judgy

A collaborative browser-based code editor for a college CS course. Students write Java.

Start with [`CLAUDE.md`](CLAUDE.md), then [`docs/DECISIONS.md`](docs/DECISIONS.md) (the
append-only architecture decision log) and [`docs/BOOTSTRAP.md`](docs/BOOTSTRAP.md) (the
ordered task list). Those three files are authoritative; this README only records what has
actually been run.

## Getting started

```
docker compose up -d    # PostgreSQL
npm install
cp .env.example .env    # populate with your database connection details
npm run dev             # applies migrations, then Keystone at http://localhost:3000
```

`npm run check` (typecheck + format + test) is the definition of green.

## Verified version set

Everything below was installed and run together on 2026-09-04: Postgres started, migrations
applied, `keystone dev` came up, the Admin UI served, and a list created and read back
through GraphQL — from a clean clone. Package versions are pinned exactly, not by range;
per `CLAUDE.md`, do not bump them as part of an unrelated task.

|                                |                                    |
| ------------------------------ | ---------------------------------- |
| Node                           | 24.18.1 (`.nvmrc`, from the image) |
| npm                            | 11.16.0                            |
| PostgreSQL                     | 18.4 (`postgres:18.4-alpine`)      |
| `@keystone-6/core`             | 8.1.0                              |
| `@keystone-6/auth`             | 10.0.5 (installed, not yet wired)  |
| `@keystar/ui`                  | 0.10.0                             |
| `next`                         | 16.3.4                             |
| `react` / `react-dom`          | 19.0.8                             |
| `react-aria` / `react-stately` | 3.50.0 / 3.48.0                    |
| `prisma` / `@prisma/client`    | 7.10.0                             |
| `@prisma/adapter-pg`           | 7.10.0                             |
| `pg`                           | 8.23.0                             |
| `graphql`                      | 16.14.2                            |
| `typescript`                   | 5.9.3                              |
| `eslint` / `typescript-eslint` | 10.10.0 / 8.69.0                   |
| `vitest`                       | 5.0.0                              |
| `prettier`                     | 3.9.6                              |
| `dotenv`                       | 17.4.2                             |

`CLAUDE.md`'s pre-approved dependency list has been updated to cover `react-aria`,
`react-stately`, `@prisma/adapter-pg`, `typescript-eslint` and `@eslint/js`. The first two
are exact-version peer dependencies of `@keystone-6/core` 8.1.0; the third is required
because Prisma 7 cannot connect without a driver adapter.

TypeScript stays on 5.x deliberately: `typescript-eslint` peers `typescript <6.1.0`, so
moving to 7.x costs the entire lint step.

### Known vulnerabilities

`npm audit` reports 3 high-severity advisories, all from `image-size` reached through
`@keystone-6/core`. Every published version is affected and there is no fix. Two other
advisories (`deepmerge-ts`, `mysql2`, both via Prisma) are resolved by `overrides` in
`package.json`; drop those once Prisma's own ranges catch up.

### Two things that will bite you

- **Keystone 8 has no `db.url`, and Prisma 7 has no `datasourceUrl`.** A driver adapter is
  mandatory. Current tutorials for both projects show forms that do not work here; see the
  comments in `src/keystone/config.ts`.
- **Postgres 18 moved the data directory.** The Compose volume mounts at
  `/var/lib/postgresql`, not `/var/lib/postgresql/data`. The older path crash-loops.

### Verified separately, outside this repo

`y-monaco` 0.1.6 drives `monaco-editor` 0.56.0 correctly: two browser tabs on one `Y.Doc`
converged with no console errors. One caveat — Monaco 0.56.0 added an `exports` map that
breaks y-monaco's own `monaco-editor/esm/vs/editor/editor.api.js` import path. Vendoring
the binding per ADR-0006 removes that import, so it is not a problem for us. Again, see the
Task 0 report.
