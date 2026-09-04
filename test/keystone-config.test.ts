import { describe, expect, it } from 'vitest'

import config from '../src/keystone/config'
import { databaseUrl } from '../src/keystone/database-url'

// These pin the constraints from docs/DECISIONS.md that a careless edit could silently
// undo. Every assertion here inspects a value that can actually vary — if you cannot name
// the change that would turn one red, it does not belong in this file.
describe('keystone config', () => {
  it('uses the PostgreSQL provider and nothing else (ADR-0002)', () => {
    expect(config.db.provider).toBe('postgresql')
  })

  it('resolves a PostgreSQL connection string, never SQLite (ADR-0002)', () => {
    // Goes through the resolved URL rather than JSON-stringifying `config.db`. The
    // connection string lives inside the `prismaClientOptions` closure, so serialising
    // that object renders it as "[function]" and the assertion can never fail.
    expect(databaseUrl).toMatch(/^postgres(ql)?:\/\//)
    expect(databaseUrl).not.toMatch(/sqlite|^file:/i)
  })

  it('supplies the driver adapter Prisma 7 requires', () => {
    const options = config.db.prismaClientOptions()
    expect(options).toHaveProperty('adapter')
  })

  it('exposes the placeholder SmokeTest list and no domain lists yet', () => {
    // Deliberately exact: when the real lists land this fails, which is the prompt to
    // drop SmokeTest in the same migration that introduces them.
    expect(Object.keys(config.lists)).toEqual(['SmokeTest'])
  })
})
