'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { readConfigFile, findConfigFile, withConfigFile } = require('../src/config-file')
const { normalizeOptions } = require('../src/config')

function tempProject(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wombatail-config-'))
  for (const [name, contents] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), contents, 'utf8')
  }
  return dir
}

const TS_CONFIG = `import { defineWombatailConfig } from 'babel-plugin-wombatail/runtime'

const config = defineWombatailConfig({
  themes: {
    light: { colors: { background: '#fff', primary: '#6750A4' } },
    dark: { colors: { background: '#000', primary: '#D0BCFF', danger: '#FF716A' } },
  },
  breakpoints: { xs: 0, sm: 360, md: 768 },
  settings: { adaptiveThemes: true },
}) as const

export default config

type WombatailThemes = (typeof config)['themes']

declare module 'react-native-unistyles' {
  export interface UnistylesThemes extends WombatailThemes {}
}
`

test('reads themes and breakpoints from a TypeScript config', () => {
  const dir = tempProject({ 'wombatail.config.ts': TS_CONFIG })
  const loaded = readConfigFile(path.join(dir, 'wombatail.config.ts'))
  assert.deepEqual(loaded.breakpoints, ['xs', 'sm', 'md'])
  assert.deepEqual(loaded.themeColorTokens.sort(), ['background', 'danger', 'primary'])
})

test('reads a CommonJS config through module.exports and top-level consts', () => {
  const dir = tempProject({
    'wombatail.config.js': `const themes = { light: { colors: { surface: '#fff' } } }
module.exports = { themes, breakpoints: { xs: 0, lg: 1024 } }
`,
  })
  const loaded = readConfigFile(path.join(dir, 'wombatail.config.js'))
  assert.deepEqual(loaded.breakpoints, ['xs', 'lg'])
  assert.deepEqual(loaded.themeColorTokens, ['surface'])
})

test('config file search walks up from nested source directories', () => {
  const dir = tempProject({ 'wombatail.config.ts': TS_CONFIG })
  const nested = path.join(dir, 'src', 'features')
  fs.mkdirSync(nested, { recursive: true })
  assert.equal(findConfigFile(nested), path.join(dir, 'wombatail.config.ts'))
})

test('config file fills plugin options and turns on strict theme tokens', () => {
  const dir = tempProject({ 'wombatail.config.ts': TS_CONFIG })
  const { options, path: found } = withConfigFile({}, { root: dir })
  assert.equal(found, path.join(dir, 'wombatail.config.ts'))
  const normalized = normalizeOptions(options)
  assert.deepEqual(normalized.breakpoints, ['xs', 'sm', 'md'])
  assert.equal(normalized.allowUnknownThemeColors, false)
  assert.equal(normalized.themeColorTokens.has('primary'), true)
})

test('explicit plugin options win over the config file', () => {
  const dir = tempProject({ 'wombatail.config.ts': TS_CONFIG })
  const { options } = withConfigFile(
    { breakpoints: ['sm'], themeColorTokens: ['brand'], allowUnknownThemeColors: true },
    { root: dir },
  )
  const normalized = normalizeOptions(options)
  assert.deepEqual(normalized.breakpoints, ['sm'])
  assert.deepEqual([...normalized.themeColorTokens], ['brand'])
  assert.equal(normalized.allowUnknownThemeColors, true)
})

test('configFile: false skips lookup entirely', () => {
  const dir = tempProject({ 'wombatail.config.ts': TS_CONFIG })
  const { options, path: found } = withConfigFile({ configFile: false }, { root: dir })
  assert.equal(found, null)
  assert.equal(options.configFile, undefined)
  assert.equal(normalizeOptions(options).allowUnknownThemeColors, true)
})

test('missing config file is not an error unless it was requested', () => {
  const dir = tempProject({})
  assert.equal(withConfigFile({}, { root: dir }).path, null)
  assert.throws(() => withConfigFile({ configFile: true }, { root: dir }), /no wombatail.config/)
  assert.throws(() => withConfigFile({ configFile: './nope.ts' }, { root: dir }), /configFile not found/)
})

test('non-static config fails with an actionable message', () => {
  const dir = tempProject({
    'wombatail.config.ts': `import { palette } from './palette'
export default { themes: { light: { colors: palette } }, breakpoints: { xs: 0 } }
`,
  })
  assert.throws(
    () => withConfigFile({}, { root: dir }),
    /not statically analyzable[\s\S]*configFile: false/,
  )
})

test('the Babel plugin picks up the config file for the compiled file', (t) => {
  let babel
  try {
    babel = require('@babel/core')
  } catch {
    return t.skip('@babel/core is not installed in this sandbox')
  }

  const dir = tempProject({ 'wombatail.config.ts': TS_CONFIG })
  const filename = path.join(dir, 'src', 'App.tsx')
  fs.mkdirSync(path.dirname(filename), { recursive: true })
  const transform = (code) => babel.transformSync(code, {
    filename,
    root: dir,
    cwd: dir,
    configFile: false,
    babelrc: false,
    parserOpts: { plugins: ['jsx'] },
    plugins: [require.resolve('../src/index.js')],
  }).code

  // breakpoints come from the config file
  assert.match(transform('<View className="md:p-4" />'), /md/)
  // theme tokens come from the config file, and unknown ones now fail the build
  assert.match(transform('<View className="bg-primary" />'), /primary/)
  assert.throws(() => transform('<View className="bg-primry" />'), /primry/)
})

test('config file changes are picked up through the mtime cache', () => {
  const dir = tempProject({ 'wombatail.config.ts': TS_CONFIG })
  const file = path.join(dir, 'wombatail.config.ts')
  assert.equal(readConfigFile(file).themeColorTokens.includes('accent'), false)
  fs.writeFileSync(file, TS_CONFIG.replace("primary: '#6750A4'", "primary: '#6750A4', accent: '#00A3FF'"), 'utf8')
  assert.equal(readConfigFile(file).themeColorTokens.includes('accent'), true)
})
