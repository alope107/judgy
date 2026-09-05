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
  Type in both tabs. Confirm it works at all. Connect to Keystone and confirm that the vite frontend can communicate with it. Connect to judge0 and verify submitting/testing code.
- Reconcile the **Layout** and **Commands** sections of `CLAUDE.md` against what you
  actually created. Report every mismatch; do not silently adapt to it.

**Done when:** `docker compose up -d && npm install && npm run dev` works from a clean
clone, and the README records the exact version set that worked.

**Report explicitly:**
- whether `y-monaco` 0.1.6 works against the current Monaco, and every console warning or
  error it produced. This answer determines how much of Task 2 matters.
- for each ADR, either "verified, promote to Accepted" or "contradicted: [what you saw]".
  Do not edit `docs/DECISIONS.md` yourself; the reviewer will add entries.

We are in the process of deciding a stack here - do not feel 100% pinned to decisions that have been made. If you think an alternative approach would be better, describe it. We are currently open to large changes like different libraries, base docker images &c.