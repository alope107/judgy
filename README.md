# judgy

A collaborative browser-based code editor for a college CS course. Students write Java.

Start with [`CLAUDE.md`](CLAUDE.md), then [`docs/Decisions.md`](docs/Decisions.md) (the
append-only architecture decision log) and [`docs/Bootstrap.md`](docs/Bootstrap.md) (the
ordered task list). Those three files are authoritative; this README only records what has
actually been run.

## Getting started

```
docker compose up -d    # PostgreSQL
npm install
npm run dev             # applies migrations, then Keystone at http://localhost:3000
```

No `.env` is needed for local development — the connection string falls back to the
throwaway credential in `docker-compose.yml`. Copy `.env.example` to `.env` to override it.
`npm run check` (typecheck + format + test) is the definition of green.

## Verified version set

Everything below was installed and run together on 2026-09-04: Postgres started, migrations
applied, `keystone dev` came up, the Admin UI served, and a list created and read back
through GraphQL — from a clean clone. Package versions are pinned exactly, not by range;
per `CLAUDE.md`, do not bump them as part of an unrelated task.

|                                |                                   |
| ------------------------------ | --------------------------------- |
| Node                           | 24.20.0 (`.nvmrc`)                |
| npm                            | 11.19.0                           |
| PostgreSQL                     | 18.4 (`postgres:18.4-alpine`)     |
| `@keystone-6/core`             | 8.1.0                             |
| `@keystone-6/auth`             | 10.0.5 (installed, not yet wired) |
| `@keystar/ui`                  | 0.10.0                            |
| `next`                         | 16.3.4                            |
| `react` / `react-dom`          | 19.0.8                            |
| `react-aria` / `react-stately` | 3.50.0 / 3.48.0                   |
| `prisma` / `@prisma/client`    | 7.10.0                            |
| `@prisma/adapter-pg`           | 7.10.0                            |
| `pg`                           | 8.23.0                            |
| `graphql`                      | 16.14.2                           |
| `typescript`                   | 7.0.2                             |
| `vitest`                       | 5.0.0                             |
| `prettier`                     | 3.9.6                             |
| `dotenv`                       | 17.4.2                            |

`react-aria`, `react-stately` and `@prisma/adapter-pg` are not listed in the `CLAUDE.md`
pre-approved set. The first two are exact-version peer dependencies of `@keystone-6/core`
8.1.0; the third is required because Prisma 7 cannot connect without a driver adapter. See
the Task 0 report.

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
