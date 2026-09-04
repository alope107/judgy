import { list } from '@keystone-6/core'
import { allowAll } from '@keystone-6/core/access'
import { text, timestamp } from '@keystone-6/core/fields'

import type { Lists } from './types'

// A deliberately trivial list. Task 0 only needs to prove that a list creates and reads
// through the Admin UI and GraphQL against real PostgreSQL. The real domain lists (users,
// assignments, submissions, quota) arrive after Task 3, and this list should be dropped
// in the same migration that introduces them.
//
// `allowAll` is correct *here* and nowhere else: nothing about this list is sensitive.
// The live-document field described by ADR-0007 gets create/update denied outright.
export const lists = {
  SmokeTest: list({
    access: allowAll,
    fields: {
      label: text({ validation: { isRequired: true } }),
      note: text(),

      // Keystone manages this one; per the CLAUDE.md randomness-and-time rule, `createdAt`
      // defaults are explicitly out of scope for the injectable clock.
      createdAt: timestamp({ defaultValue: { kind: 'now' } }),
    },
  }),
} satisfies Lists
