// Keystone's CLI resolves its entry point from `./keystone` relative to the project root
// and offers no flag to point it elsewhere (see `getEsbuildConfigForEntry` in
// @keystone-6/core/dist/express-*.js). This file therefore has to sit here; the actual
// configuration lives under src/keystone/ per the Layout section of CLAUDE.md.
export { default } from './src/keystone/config'
