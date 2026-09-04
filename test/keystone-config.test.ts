import { describe, expect, it } from 'vitest'

import config from '../src/keystone/config'

// These pin the constraints from docs/DECISIONS.md that a careless edit could silently
// undo. Every assertion here inspects a value that can actually vary — if you cannot name
// the change that would turn one red, it does not belong in this file.
describe('keystone config', () => {
  it('uses the PostgreSQL provider and nothing else (ADR-0002)', () => {
    expect(config.db.provider).toBe('postgresql')
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
