# Bootstrap tasks

Do these in order. One branch per task. Do not start a task before the previous one's
"Done when" is satisfied and its output has been pasted into the task report.

The ordering is deliberate and inverts the usual instinct to scaffold the application
first. Tasks 0–3 cover the decisions that are expensive or impossible to reverse. The
application code is cheap and reversible; it comes after.

---

## Task 0 — Verify the stack actually assembles

Every version claim in `docs/DECISIONS.md` came from package metadata and documentation,
not from running anything. All ADRs are currently **Proposed**. This task is what promotes
them to Accepted or supersedes them.

**Do:**
- Empty KeystoneJS 8.x project on PostgreSQL in Docker Compose, with the Next/React/Prisma
  versions its peer dependencies demand.
- `keystone dev` starts; Admin UI loads; a trivial list creates and reads.
- Separately and in isolation, in a throwaway directory outside the repo: `y-monaco` 0.1.6
  against the pinned `monaco-editor`, two browser tabs sharing one `Y.Doc` over a local
  `y-websocket`. Bundle it however is quickest — ADR-0005 does not apply to this spike.
  Type in both tabs. Confirm it works at all.
- Reconcile the **Layout** and **Commands** sections of `CLAUDE.md` against what you
  actually created. Report every mismatch; do not silently adapt to it.

**Done when:** `docker compose up -d && cp .env.example .env && npm install && npm run dev`
works from a clean clone, and the README records the exact version set that worked.

The `.env` step is not optional and is not a convenience. A missing `DATABASE_URL` fails to
start in every environment rather than falling back to a default, because a fallback would
quietly point the process at the wrong database and the damage would only surface later.
See "Failures must be noisy" in `CLAUDE.md`.

**Report explicitly:**
- whether `y-monaco` 0.1.6 works against the current Monaco, and every console warning or
  error it produced. This answer determines how much of Task 2 matters.
- for each ADR, either "verified, promote to Accepted" or "contradicted: [what you saw]".
  Do not edit `docs/DECISIONS.md` yourself; the reviewer will add entries.

Do not fix anything you find yet — report it.

---

## Task 1 — Convergence fuzz harness

Before any product code. This is the highest-value artifact in the project: it catches the
bug class that cannot be caught by reading a diff, and it survives every remaining
architectural choice.

**Environment:** a real browser. Monaco does not run in Node or jsdom without extensive
shimming, and the edit operations below are *editor* features (they need an
`ICodeEditor`), not model features. Use Playwright with headless Chromium (pre-approved in
`CLAUDE.md`). The constraint is **no server and no database**, not "no browser": two
`Y.Doc`s and two editor instances live in one page and exchange updates directly via
`Y.applyUpdate`, with no network.

**Do:** Wire two `Y.Doc`s and two Monaco editors through the binding. Generate randomized
concurrent edit streams from a seeded RNG. The stream must include, not just character
insertion:

- paste of a multi-line block
- multi-cursor edits
- bracket auto-close and snippet insertion
- find-and-replace-all (produces batched change events)
- undo and redo
- deletion spanning line boundaries
- two clients editing the same offset in the same tick
- a simulated IME composition sequence if Playwright can drive one; if not, report that it
  is untested rather than omitting it silently

**Assert after quiescence:**
- `model.getValue() === ytext.toString()` on each side independently
- both models agree with each other
- no unhandled exception or console error occurred during the run

**Done when:** `npm run fuzz` runs N randomized rounds and prints pass/fail; `npm run fuzz
-- --seed 40371` deterministically replays one round; and on failure it prints a minimal
reproducing edit sequence, not just a diff of the final text.

**Standing rule:** every failure the fuzzer finds becomes a permanent regression test,
pinned by seed, committed **before** the fix.

Task 1 may target the upstream `y-monaco` npm package directly, bundled by Vite, since
Task 2 has not happened yet. When Task 2 lands, the harness switches to the vendored copy
and must still pass.

---

## Task 2 — Vendor the binding, run the harness against it

**Do:**
- Copy `src/y-monaco.js` from upstream into `src/vendor/y-monaco/y-monaco.js`. Copy the
  upstream `LICENSE` (MIT) into the same directory. Add a header comment recording
  upstream repo, version, commit hash, and date. Commit this **verbatim** first.
- In a second, separate commit, make exactly one content change: remove the static
  `import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js'` and accept the
  `monaco` namespace as the first constructor parameter. Update every `monaco.` reference
  to use the parameter. Nothing else changes. Per ADR-0005, nothing under `src/vendor/`
  may import `monaco-editor` as a value.
- Configure `tsconfig` with `allowJs: true` and exclude `src/vendor/**` from `checkJs`.
  Keep the file as `.js`. Do not convert it to TypeScript.
- Switch the Task 1 harness to the vendored copy, obtaining `monaco` from
  `@monaco-editor/loader`'s `loader.init()` against the self-hosted `web/public/vs/`
  path — i.e. the harness now also exercises ADR-0005.
- Run the harness. Record the result.
- Fix only what the harness proves is broken. The deprecated `editor.deltaDecorations`
  call (ADR-0006) may be updated to `createDecorationsCollection` since it is mechanical
  and type-visible; anything beyond that needs a failing test first.

**Done when:** the harness passes over a long run against the vendored copy loaded via the
AMD loader, with the seed count and the wall-clock duration reported, and `git diff` between
the verbatim commit and the injection commit touches only the import line, the constructor
signature, and `monaco.` references.

**Do not** rewrite the binding. Do not "clean up" or restructure it while vendoring.

---

## Task 3 — Lock the playback log format

The other irreversible decision. Once real keystrokes accumulate we are married to this
format, so it gets fixed under test while the data is still throwaway.

**Do:**
- Define the append-only update log as a raw Prisma model added via
  `db.extendPrismaSchema` (ADR-0007), not a Keystone list. Columns: document ID,
  monotonic per-document sequence number, Yjs update payload (`bytes`), `encoding` (`1`
  for Yjs v1 — pinned in ADR-0007), our own timestamp from the injectable clock, client
  ID.
- Define periodic snapshots (`Y.encodeStateAsUpdate`, v1) that bound replay cost, with
  the sequence number they cover.
- Write `replay(log)` and `replay(snapshot, logSuffix)`.

**Assert:**
- `replay(fullLog)` equals the final document state
- `replay(snapshot, suffix)` equals the same final state
- replay to an arbitrary midpoint is stable across runs
- the log round-trips through the actual Postgres `bytea` column unchanged (this is the
  one place a database is used before the application exists)
- sequence numbers are gapless and unique per document under concurrent writers

**Done when:** those tests pass against logs generated by the Task 1 fuzzer, not against
hand-written fixtures. The fuzzer produces exactly the adversarial edit patterns that
naive log formats fail on.

**Report:** measured bytes of log per 1,000 edit operations. This is the input to the
per-user storage quota and is worth knowing before the quota is designed.

---

## After Task 3

Only now does application work start. Rough order, each still one branch per task:

1. Keystone lists: users, assignments, submissions, quota. Access control denying
   create/update on the live-document field per ADR-0007 — and a test proving a GraphQL
   mutation against it is rejected, since `fieldMode` alone enforces nothing.
2. `extendHttpServer` WebSocket wiring, with handshake authentication against the Keystone
   session (ADR-0008). Vite dev proxy for GraphQL and the WebSocket path.
3. Persistence: WebSocket handler writing the update log and debounced snapshots directly
   to Postgres via the single sudo'd path.
4. Vite SPA shell, auth, document list.
5. Monaco via the self-hosted loader (ADR-0005), wired to the vendored binding.
6. Submission flow: one-way snapshot from `Y.Doc` to an immutable submission row.
7. Playback UI over the log from Task 3.
8. Diagnostics and completion via the javac compiler API.
9. Judge0 on the execution droplet, jobs submitted from the app droplet.

Steps 8 and 9 compile and run student-supplied code. In production that happens only on
the execution droplet (ADR-0003). Running `javac` or Judge0 in Docker on a developer
machine during local development is fine, provided that machine holds no real student data
— which, per `CLAUDE.md`, it never should.