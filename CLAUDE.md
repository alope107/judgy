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

Do not upgrade pinned versions as part of an unrelated task.

## Commands

```
npm run check     # typecheck + lint + test — this is what "green" means
npm run dev       # Keystone dev server (Admin UI + GraphQL + WebSocket upgrade)
                  # once migrations are committed this runs `keystone dev --no-db-push`
npm run dev:web   # Vite dev server for the student editor
npm run fuzz      # convergence fuzz harness; --seed N to reproduce a specific run
docker compose up -d   # PostgreSQL
```

`npm run check` is the definition of done. Not "the file I touched compiles."

TypeScript runs in strict mode. Keystone generates types from the list schema — use them.
Do not add `any`, `@ts-ignore`, or `@ts-expect-error` to get past a type error; the type
error is usually correct.

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
  `react-dom`, `prisma`, `@prisma/client`, `pg`, `graphql`, `@keystar/ui`
- Collaboration: `yjs`, `y-protocols`, `lib0`, `y-websocket` (server side only), `ws`
- Editor: `monaco-editor`, `@monaco-editor/react`, `@monaco-editor/loader`
- Frontend: `vite`, `@vitejs/plugin-react`
- Tooling: `typescript`, `vitest`, `@playwright/test`, `playwright`, `eslint`,
  `prettier`, `@types/*` for anything above
- Dev database tooling: `dotenv`

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
src/vendor/y-monaco/     vendored binding, .js, with LICENSE (see ADR-0006)
src/keystone/            lists, access control, extendHttpServer wiring
src/collab/              Yjs WebSocket server, persistence, playback log
web/                     Vite SPA — the student editor
web/public/vs/           self-hosted Monaco, copied by postinstall (ADR-0005)
test/fuzz/               convergence harness (Playwright)
```