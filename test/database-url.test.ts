import { afterEach, describe, expect, it, vi } from 'vitest'

// The resolver runs once at import time, so each case re-imports it with a different
// environment. Without this the module cache would make every assertion after the first
// one test the same already-resolved value — a test that cannot fail.
async function loadWithEnv(env: Record<string, string | undefined>) {
  vi.resetModules()
  // Stop dotenv from reading a developer's real .env into these assertions.
  vi.stubEnv('DOTENV_CONFIG_PATH', '/dev/null')
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value)
  return import('../src/keystone/database-url')
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('database URL resolution', () => {
  it('uses DATABASE_URL when it is set', async () => {
    const { databaseUrl } = await loadWithEnv({
      DATABASE_URL: 'postgres://someone@db.example:5432/judgy',
      NODE_ENV: 'production',
    })
    expect(databaseUrl).toBe('postgres://someone@db.example:5432/judgy')
  })

  it('refuses to fall back in production, and says why', async () => {
    await expect(
      loadWithEnv({ DATABASE_URL: undefined, NODE_ENV: 'production' })
    ).rejects.toThrow(/DATABASE_URL is not set/)
  })

  it('falls back in development but announces it on stderr', async () => {
    // The point of this case is the warning, not the value. A fallback nobody can see is
    // the failure mode this whole arrangement exists to prevent.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { databaseUrl } = await loadWithEnv({
      DATABASE_URL: undefined,
      NODE_ENV: 'development',
    })

    expect(databaseUrl).toBe('postgres://judgy:judgy@localhost:5432/judgy')
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]?.[0]).toMatch(/DATABASE_URL is not set/)
  })

  it('treats a blank DATABASE_URL as unset rather than connecting to nothing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { databaseUrl } = await loadWithEnv({
      DATABASE_URL: '   ',
      NODE_ENV: 'development',
    })

    expect(databaseUrl).toBe('postgres://judgy:judgy@localhost:5432/judgy')
    expect(warn).toHaveBeenCalledTimes(1)
  })
})
