import js from '@eslint/js'
import tseslint from 'typescript-eslint'

// Flat config. `.mjs` because package.json has no `"type": "module"` — Keystone expects
// the project to stay CommonJS-ambiguous, so this file opts itself into ESM instead.
export default tseslint.config(
  {
    // Generated, vendored, and build output. Nothing here is ours to lint.
    ignores: [
      'node_modules/',
      'generated/',
      '.keystone/',
      'dist/',
      'web/dist/',
      'src/keystone/types.ts',
      'src/keystone/migrations/',

      // ADR-0006: the vendored binding stays diffable against upstream. tsconfig already
      // excludes it from checkJs; linting it would produce churn we must not act on.
      'src/vendor/',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    rules: {
      // CLAUDE.md: no `any`, and no silencing the type checker. The type error is usually
      // correct, so these are errors rather than warnings — `npm run check` should fail.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-ignore': true, 'ts-expect-error': true, 'ts-nocheck': true },
      ],

      // Unused code is usually a half-finished edit. Leading underscore opts out.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  {
    // Config files at the repo root legitimately run in Node.
    files: ['*.mjs', '*.ts', 'prisma.config.ts', 'keystone.ts'],
    languageOptions: {
      globals: { process: 'readonly', console: 'readonly' },
    },
  }
)
