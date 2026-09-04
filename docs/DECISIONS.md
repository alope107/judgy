# Architecture decision log

Append-only. Never edit an entry in place. To change a decision, add a new entry that
supersedes the old one and mark the old one `Superseded by ADR-NNNN`.

Format: Status / Context / Decision / Consequences. Keep entries short.

Version numbers below were current as of September 2026 and are recorded as the basis for
each decision, not as a claim about today. Re-check before acting on one.

Status meanings: **Proposed** — decided in design discussion, not yet verified by running
anything. **Accepted** — verified in this repo. Task 0 in `docs/BOOTSTRAP.md` promotes or
supersedes the Proposed entries.

---

## ADR-0001 — Admin layer: KeystoneJS 6 (v8.x)

**Status:** Proposed

**Context:** We wanted a Django-admin-style generated admin panel over a Node backend.
AdminJS is the closest analogue but its last release was 7.8.17 in July 2025 and its
Express adapter last shipped December 2024. Directus introspects an existing database but
carries licence conditions (MSCL, with a free grant below revenue and headcount
thresholds) and is aimed at a database you already have. Payload 3 is Next.js-native and
no longer mountable as a separate server. We are greenfield with no existing schema.

**Decision:** KeystoneJS 6, package line `@keystone-6/core` 8.x. Schema defined in code,
Prisma underneath, MIT licensed, actively released.

**Consequences:**
- Keystone dictates our Next and React majors (8.x requires `next@^16`, `react@^19`,
  `react-dom@^19`, `prisma@^7.9`, Node >= 20.19). A Next major bump waits on Keystone.
- The Admin UI is built on `@keystar/ui` (peer-pinned `~0.10.0`), not the older
  `@keystone-ui/*`. Most tutorials and Stack Overflow answers target the old library and
  will mislead.
- Keystone no longer creates or applies migrations. We drive `prisma migrate` ourselves.

---

## ADR-0002 — Database: PostgreSQL from day one

**Status:** Proposed

**Context:** SQLite was attractive for "start small, scale only if needed." Three things
killed it. Prisma migration SQL is dialect-specific, so a SQLite migration history is
worthless against Postgres and must be discarded on switch. Postgres is case sensitive by
default while SQLite is not for `contains`/`startsWith`/`endsWith`, and Keystone's
`mode: 'insensitive'` filter is unsupported on SQLite — so search behaviour silently
changes on migration and cannot even be tested beforehand. Keystone's own docs do not
recommend SQLite in production outside embedded scenarios. Finally, ADR-0003 puts the
execution service on a separate host and we may later move the frontend or database off
the app host; SQLite cannot be shared across hosts.

**Decision:** PostgreSQL everywhere — local development, CI, and production. Local
Postgres runs in Docker Compose.

**Consequences:**
- One extra container locally. That is the entire cost.
- Migrations are applied with `prisma migrate deploy` as an explicit release step before
  the Keystone process restarts.
- Use `keystone dev --no-db-push` once migrations are being committed, so `db push` does
  not drift the dev database from migration history.
- Managed Postgres is a connection-string change whenever we want point-in-time recovery.

---

## ADR-0003 — Deployment: two DigitalOcean droplets, split on trust

**Status:** Proposed

**Context:** With ADR-0004 the application is a single Keystone process plus static files
— there is no separate frontend server. One host would suffice for the application.
Judge0, however, executes untrusted student Java, and that must not share a kernel with
the database or the admin panel. The split is a trust boundary, not a scaling measure.

**Decision:**
- **App droplet:** Keystone (Admin UI + GraphQL + WebSocket), the static SPA bundle, and
  PostgreSQL, behind a reverse proxy that serves static assets and routes by hostname.
- **Execution droplet:** Judge0 and any service that compiles or runs student code in
  production, firewalled to accept jobs only from the app droplet.

**Consequences:**
- Student code never shares a kernel with the database or the admin panel in production.
  This constraint is about production; running `javac` or Judge0 in Docker on a developer
  machine during local development is fine, provided that machine holds no real student
  data.
- Sizing: at least 2 GB on the app droplet. Keystone's Admin UI build is a Next build and
  OOMs on 1 GB. Prefer building in CI and shipping artifacts.
- The admin panel is internet-facing on its own subdomain. It gets an IP allowlist or an
  auth layer in the reverse proxy in addition to Keystone's session auth.
- Keystone local file/image storage works because there is one app host. If that ever
  changes, uploads move to object storage first.

---

## ADR-0004 — Student editor frontend: Vite SPA, not Next.js

**Status:** Proposed

**Context:** Keystone depends on Next for its Admin UI, but nothing requires us to write
Next application code. The editor is an auth-gated, stateful client app: server rendering
buys nothing and there is no SEO surface. Next 16 defaults to Turbopack, which does not
apply webpack config, and Monaco's bundler story is webpack-shaped.

**Decision:** The student editor is a Vite SPA talking to Keystone's GraphQL API and the
Yjs WebSocket endpoint. No Next application code in this repo. In production the built
SPA is served as static files by the reverse proxy on the app droplet.

**Consequences:**
- We are insulated from Keystone's Next major bumps in our own code.
- No server components or Next route handlers; Keystone is the API surface.
- Two dev servers locally (`npm run dev`, `npm run dev:web`). The Vite dev server proxies
  `/api/graphql` and the WebSocket path to Keystone so session cookies stay same-origin.

---

## ADR-0005 — Monaco loaded via the AMD loader, self-hosted

**Status:** Proposed

**Context:** Monaco is browser-only and breaks under SSR. Bundling it requires
bundler-specific configuration, and `monaco-editor-webpack-plugin` has been an archived,
read-only repository since November 2023; `vite-plugin-monaco-editor` last published in
2022. `@monaco-editor/react` exists specifically to embed Monaco without bundler
configuration, loading from a CDN by default, redirectable via
`loader.config({ paths: { vs: '...' } })`.

**Decision:** Use `@monaco-editor/react` with the loader pointed at a self-hosted copy of
`monaco-editor/min/vs`, copied into `web/public/vs/` by a postinstall step. Do not bundle
Monaco. Do not add a Monaco bundler plugin. **No file in `web/` or `src/vendor/` may
statically import `monaco-editor`**; the `monaco` namespace is obtained at runtime from
`loader.init()` / `useMonaco()` and passed to anything that needs it.

**Consequences:**
- Monaco never enters the bundler's module graph, so this survives any future bundler
  change.
- Self-hosting rather than CDN avoids Content-Security-Policy breakage and works offline.
- `monaco-editor` is pinned exactly; the vendored binding in ADR-0006 tracks its model API.
- `monaco-editor` stays in `package.json` as the source of the `min/vs` files and of type
  definitions (`import type` is permitted); it is never imported as a value.
- `@monaco-editor/react` was last published February 2025. It is a thin wrapper; accepted
  risk, and replaceable with `@monaco-editor/loader` or direct loader use if needed.

---

## ADR-0006 — Vendor the Yjs↔Monaco binding rather than depend on or rewrite it

**Status:** Proposed

**Context:** `y-monaco` 0.1.6 was last published July 2024 — the least maintained link in
the chain, and the most load-bearing. But the binding is only 222 lines, sits on two
stable APIs, and encodes non-obvious correctness details: mutex-based echo suppression,
applying batched Monaco change events right-to-left by `rangeOffset`, and relative
positions for remote cursors that survive concurrent edits. A from-scratch rewrite is an
afternoon of code and then weeks of intermittent, data-corrupting bugs that no amount of
code review finds. Because we persist a keystroke log (ADR-0007), binding bugs corrupt
history permanently and silently.

The upstream source begins `import * as monaco from
'monaco-editor/esm/vs/editor/editor.api.js'` and references the `monaco` namespace
(`monaco.Selection`, `monaco.SelectionDirection`) throughout. A verbatim copy would pull
Monaco into the bundle, violating ADR-0005.

**Decision:** Copy the binding source into `src/vendor/y-monaco/` as JavaScript, with the
upstream MIT `LICENSE` file alongside it and a header comment recording upstream repo,
version, commit, and date. Make **exactly one** content change: remove the static
`monaco-editor` import and accept the `monaco` namespace as a constructor parameter
(`new MonacoBinding(monaco, ytext, model, editors, awareness)`). Otherwise byte-identical.
Maintain reactively. Do not rewrite.

**Consequences:**
- y-monaco is MIT licensed; the copyright notice must be retained. It is.
- The file stays `.js` with JSDoc so it remains diffable against upstream. `tsconfig` has
  `allowJs: true` and excludes this directory from `checkJs`.
- Known first drift: the binding calls `editor.deltaDecorations(...)`, which Monaco 0.56's
  own type definitions mark `@deprecated Use createDecorationsCollection`. Still present,
  so it works; a one-line fix when it stops. This is representative of the expected
  maintenance shape — small, mechanical, occasional.
- Changes to this directory get line-by-line review.
- Known weak spots to test rather than assume: IME/composition input, undo scoping (Monaco
  owns its own undo stack; without a `Y.UndoManager` scoped by origin, ctrl-Z undoes a
  collaborator's edits), and multi-change events from find-and-replace-all, multi-cursor,
  bracket auto-close, snippets, and format-on-type.
- If we later move to CodeMirror 6, `y-codemirror.next` is actively maintained (0.3.6,
  August 2026) and this ADR is superseded — but the fuzz harness and the log format
  survive that change unchanged, which is why they come first.

---

## ADR-0007 — Y.Doc is authoritative; submissions are one-way snapshots

**Status:** Proposed

**Context:** The invariant we care about is that what the student sees is what gets
submitted. Yjs makes the CRDT authoritative, but Keystone's Admin UI will happily let a
staff user edit the same row, and a blind write clobbers the document with no merge —
a silent second writer.

**Decision:**
- The `Y.Doc` owns live document text. Nothing else writes it.
- Keystone owns metadata: users, assignments, quotas, and **immutable submission
  snapshots** materialised one-way from the `Y.Doc` at submit time.
- **Enforcement is access control.** The live-document snapshot field on the Keystone
  list has `access: { create: () => false, update: () => false }` (or equivalent
  `operation`/`field`-level denial) so it cannot be written via GraphQL by anyone, and
  `ui.itemView.fieldMode: 'read'` so it is also not editable in the Admin UI. The
  `fieldMode` setting is cosmetic and enforces nothing on its own. The WebSocket handler
  writes this field via `context.sudo().db` or Prisma directly, bypassing access control
  deliberately and in one place.
- Persistence for live state is a `bytes` field holding `Y.encodeStateAsUpdate` output
  (Keystone's `bytes` field stores binary as `Uint8Array` with `validation.length.max`).
- **Playback uses an append-only update log, not snapshots.** Compacted state loses
  history. Yjs updates carry no wall-clock time, so we record timestamps and client IDs
  ourselves alongside each update. Periodic snapshots exist to bound replay cost.
- **The update log is a raw Prisma table, not a Keystone list.** It is added via
  `db.extendPrismaSchema` and written only by the WebSocket handler. A Keystone list would
  expose millions of rows through the Admin UI and GraphQL and add per-row overhead we do
  not want. Playback reads it through a purpose-built query, not the generated GraphQL API.
- **Update encoding is Yjs v1** (`Y.encodeStateAsUpdate` / `Y.applyUpdate`), matching what
  `y-websocket` speaks on the wire. The log row records an `encoding` column (`1`) so a
  future move to v2 is a new value, not a migration of old rows.
- Hot-path writes go from the WebSocket handler to the database directly, never a GraphQL
  mutation per update. Debounce snapshots.

**Consequences:**
- The update log, not the final files, is where the storage quota actually goes.
- The log format is effectively irreversible once real student data accumulates. It gets
  round-trip tests before any student touches the system (see `docs/BOOTSTRAP.md`).
- Two write paths exist on purpose: GraphQL for everything Keystone owns, and one sudo'd
  direct write in the WebSocket handler for live state and the log. Nothing else may use
  `sudo()` to write document text.

---

## ADR-0008 — The Yjs WebSocket server runs inside the Keystone process

**Status:** Proposed

**Context:** Yjs needs a long-lived process holding `Y.Doc`s in memory. Keystone's
`server.extendHttpServer(httpServer, commonContext)` hook is documented for listening to
`'upgrade'` requests to attach a WebSocket server, and hands over a bound Keystone context.

**Decision:** Attach the Yjs WebSocket server via `extendHttpServer`. Authenticate the
handshake against the same Keystone session that gates the Admin UI, by resolving the
session cookie through the Keystone context before accepting the upgrade.

**Consequences:**
- One process, and one authentication path instead of two.
- Under `keystone dev`, `extendHttpServer` is called once at startup — restart the process
  after changing it.
- A single process holds all open documents in memory. At 200 users this is trivial and
  needs no cross-node awareness layer (Redis, etc.). If we ever scale horizontally, that
  assumption breaks and this ADR needs revisiting.
- In local development the Vite dev server must proxy the WebSocket path to Keystone
  (ADR-0004) so the session cookie is sent on the upgrade request.