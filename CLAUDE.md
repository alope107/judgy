# CLAUDE.md — how to work in this repository

Read this file and `docs/DECISIONS.md` at the start of every session. `docs/DECISIONS.md`
records architectural decisions that are already made; do not relitigate them or quietly
work around them. If you believe a decision is wrong, say so and stop — do not implement
the alternative.

## What this is

A collaborative browser-based code editor for a college CS course. Students write Java.
Roughly 200 users, no more. Core features:

- Real-time multi-user editing (Google-Docs style)
- Keystroke-level playback of a student's editing session
- IntelliSense-style diagnostics and completion
- Server-side code execution against test cases
- User accounts with a small per-user storage quota

The load-bearing invariant: **the state the client displays is the state that gets
submitted.** Any design that introduces a second writer to live document state violates
this and is wrong.

## Hard constraints

These come from `docs/DECISIONS.md`. Restated here because they are the ones most often
violated by accident.

- **PostgreSQL only.** Never SQLite, not even for local development or tests.
- **The `Y.Doc` is authoritative for live document text.** Keystone owns metadata and
  immutable submission snapshots. Nothing else writes live text. Enforcement is Keystone
  access control, not Admin UI field modes (ADR-0007).
- **The editor frontend is a Vite SPA, not a Next.js app.** Next exists in the tree only
  as Keystone's Admin UI dependency. Do not add Next application code.
- **Monaco is loaded via the AMD loader from a self-hosted path, not bundled.** Do not add
  bundler plugins for Monaco. Nothing under `web/` or `src/vendor/` may statically import
  `monaco-editor` (ADR-0005, ADR-0006).
- **The Yjs binding is vendored source in this repo, not an npm dependency.**
- **Untrusted student code never executes on the production application host.** Local
  development on a developer machine is fine; production Judge0 runs on its own host
  (ADR-0003).

## Environment

- Node: pinned in `.nvmrc` and `engines`. Use that version. Keystone 8 requires >= 20.19.
- PostgreSQL: via `docker compose up -d`. There is no other supported database.
- Package versions are pinned exactly, not by range. Keystone's peer dependencies are
  strict; a floating install produces errors that look like application bugs but are not.
  If an install fails, suspect version drift before suspecting the code.
- `overrides` in `package.json` force patched versions of transitive dependencies that a
  parent pins to a vulnerable range (currently `deepmerge-ts` and `mysql2`, both reached
  through Prisma). Re-check them at every Prisma bump and remove each one as soon as the
  parent catches up — an override that outlives its advisory silently holds back a
  dependency for no reason. `npm audit` is the check; it should report only `image-size`,
  which has no fixed version at any release.

Do not upgrade pinned versions as part of an unrelated task.

## Commands

```
npm run check     # typecheck + lint + format:check + test — this is what "green" means
npm run dev       # Keystone dev server (Admin UI + GraphQL + WebSocket upgrade)
                  # runs `prisma migrate deploy && keystone dev --no-db-push`
npm run dev:web   # Vite dev server for the student editor        (not yet — Task 1+)
npm run fuzz      # convergence fuzz harness; --seed N to reproduce a specific run
                  #                                                (not yet — Task 1)
docker compose up -d   # PostgreSQL
```

`npm run check` is the definition of done. Not "the file I touched compiles."

`npm run dev` applies migrations before starting. `--no-db-push` deliberately never
touches the schema (ADR-0002), so without the migrate step a fresh clone starts against a
database with no tables. No `.env` is required locally; the connection string falls back to
the throwaway credential in `docker-compose.yml`.

TypeScript runs in strict mode. Keystone generates types from the list schema — use them.
Do not add `any`, `@ts-ignore`, or `@ts-expect-error` to get past a type error; the type
error is usually correct. ESLint enforces all three, so this fails `npm run check` rather
than relying on review to catch it.

TypeScript is pinned to the 5.x line, not 7.x. `typescript-eslint` peers `typescript <6.1.0`
and nothing in the lint ecosystem supports 7 yet, so TypeScript 7 costs the entire lint
step. Revisit when that changes.

Exception: `src/vendor/y-monaco/` is JavaScript with JSDoc, kept as `.js` so it stays
diffable against upstream. `tsconfig` sets `allowJs: true` and excludes that directory from
`checkJs`. Do not convert it to TypeScript.

## Task protocol

1. Start from a clean tree on a branch named for the task.
2. Restate the task and your plan before writing code. Wait for confirmation on anything
   that touches a hard constraint above.
3. Implement in small commits. Each commit should be independently green — `git bisect` is
   how concurrency bugs get found months from now, and it only works on fine-grained
   history.
4. End with the command you ran and its **actual pasted output**. "Tests pass" without a
   transcript is not a result.
5. Report what you did not do, what you guessed at, and what you are unsure about.

One task per branch. Do not opportunistically fix unrelated things you notice — write them
down at the end of the report instead.

## Prohibitions

- **Never weaken an assertion, add a retry, add a sleep, increase a timeout, or mark a test
  skipped to make it pass.** For a concurrency test this converts a real bug into a silent
  one. If a test fails and you cannot fix the cause, stop and report.
- **Never install a package outside the pre-approved list below without asking first.**
  When proposing one, state its latest version, its last publish date, and why twenty
  lines of our own code will not do. This project has already been bitten by transitive
  staleness.
- **Never point at the production database or a production host.** 
- **Never use real student code, submissions, or names** in fixtures, tests, or seed data.
  Generate synthetic Java. Prior-term submissions are education records.
- **Never introduce SQLite**, including as a "faster test database."
- **Never edit `docs/DECISIONS.md` in place.** It is append-only. Propose a new entry that
  supersedes an old one.
- Do not commit `.env`, secrets, or connection strings.

## Pre-approved dependencies

These may be installed without asking, at exact pinned versions:

- Keystone and its required peers: `@keystone-6/core`, `@keystone-6/auth`, `next`, `react`,
  `react-dom`, `prisma`, `@prisma/client`, `pg`, `graphql`, `@keystar/ui`, `react-aria`,
  `react-stately`, `@prisma/adapter-pg`
- Collaboration: `yjs`, `y-protocols`, `lib0`, `y-websocket` (client only — see below),
  `ws`
- Editor: `monaco-editor`, `@monaco-editor/react`, `@monaco-editor/loader`
- Frontend: `vite`, `@vitejs/plugin-react`
- Tooling: `typescript`, `vitest`, `@playwright/test`, `playwright`, `eslint`,
  `typescript-eslint`, `@eslint/js`, `prettier`, `@types/*` for anything above
- Dev database tooling: `dotenv`

Three notes on that list, all found by running things in Task 0:

- `react-aria` and `react-stately` are peer dependencies of `@keystone-6/core` 8.1.0 at
  **exact** versions. They are not optional and npm will not resolve without them.
- `@prisma/adapter-pg` is not optional either. Prisma 7 removed `datasourceUrl` and
  requires a driver adapter; the only alternative is Prisma's paid Accelerate service.
- `y-websocket` 3.x ships **no server**. It has no `bin`, and the `y-websocket-server`
  package on npm is an abandoned 2022 stub. ADR-0008 has us writing our own server via
  `extendHttpServer` anyway, so nothing is blocked — but do not plan around a server that
  does not exist.

Anything else — including "small" utilities like lodash, date libraries, or alternative
test runners — requires asking.

## Randomness and time

Scope: **test code, the fuzz harness, and the playback-log write path.** Within that scope,
all randomness is seeded and the seed is logged, and all timestamps come from an injectable
clock rather than `Date.now()` called inline. Both are required: the fuzz harness is
worthless if a failure cannot be replayed, and the playback log needs timestamps tests can
control.

This does not apply to Keystone internals, session tokens, IDs, or `createdAt` fields
Keystone manages. Do not seed or override those.

## Review policy

Diffs touching these get read line by line, so keep them small, legible, and heavily
commented:

- `src/vendor/y-monaco/` — the vendored collaborative binding
- anything defining or writing the playback log format or its Prisma schema extension
- anything in the WebSocket upgrade / session authentication path
- access control on the live-document field

Everything else is skimmed. Do not bury a change to the above inside a large refactor.

## Layout

This is the intended shape. It is reconciled against the real repo in Task 0; a mismatch is
a documentation bug to report, not something to work around silently.

```
docs/DECISIONS.md        append-only architecture decision log — read first
docs/BOOTSTRAP.md        the ordered task list for initial work
keystone.ts              Keystone entry point; re-exports src/keystone/config.ts
prisma.config.ts         Prisma 7 CLI config — schema path, migrations path, datasource
src/vendor/y-monaco/     vendored binding, .js, with LICENSE (see ADR-0006)
src/keystone/            lists, access control, extendHttpServer wiring
src/keystone/schema.prisma, schema.graphql, types.ts, migrations/
                         generated by Keystone and committed; do not hand-edit
src/collab/              Yjs WebSocket server, persistence, playback log
web/                     Vite SPA — the student editor
web/public/vs/           self-hosted Monaco, copied by postinstall (ADR-0005)
test/fuzz/               convergence harness (Playwright)
generated/               generated Prisma client — gitignored, rebuilt on every build
```

Two root files are not negotiable. Keystone's CLI resolves its entry from `./keystone` at
the project root with no override, so `keystone.ts` must live there; it is a one-line
re-export and the real configuration is in `src/keystone/config.ts`. Prisma 7 requires
`prisma.config.ts` at the root, and Keystone will scaffold a default one pointing at
root-level paths if it is missing — ours points into `src/keystone/` instead, so that a
schema change and its migration land next to the lists that produced them.