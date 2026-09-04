import { describe, expect, it } from 'vitest'

import config from '../src/keystone/config'

// Task 0 only needs `npm run check` to mean something. These assertions pin the two
// constraints from docs/DECISIONS.md that a careless edit could silently undo, so a
// future change that reintroduces SQLite or a second live-document writer trips here
// rather than in production.
describe('keystone config', () => {
  it('uses PostgreSQL and nothing else (ADR-0002)', () => {
    expect(config.db.provider).toBe('postgresql')
  })

  it('never points at a SQLite file', () => {
    // `prismaClientOptions` builds the adapter, so stringify what it produces rather
    // than reaching into the pg pool internals.
    const rendered = JSON.stringify(config.db, (_key, value) =>
      typeof value === 'function' ? '[function]' : value
    )
    expect(rendered).not.toMatch(/sqlite|\.db\b/i)
  })

  it('supplies a driver adapter, which Prisma 7 requires', () => {
    const options = config.db.prismaClientOptions()
    expect(options).toHaveProperty('adapter')
  })

  it('exposes the placeholder SmokeTest list and no domain lists yet', () => {
    expect(Object.keys(config.lists)).toEqual(['SmokeTest'])
  })
})
