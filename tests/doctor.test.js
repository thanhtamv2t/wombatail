'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { parseVersion, gte, initConfig } = require('../bin/wombatail')
const { readConfigFile } = require('../src/config-file')

test('doctor semver helpers handle production compatibility checks', () => {
  assert.deepEqual(parseVersion('0.78.4'), [0, 78, 4])
  assert.equal(gte([0, 35, 2], [0, 35, 2]), true)
  assert.equal(gte([0, 35, 1], [0, 35, 2]), false)
  assert.equal(gte([3, 2, 0], [3, 1, 9]), true)
})

test('wombatail init scaffolds a config the compiler can read back', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wombatail-init-'))

  const created = initConfig({ cwd: dir })
  assert.equal(created.created, true)
  assert.equal(path.basename(created.file), 'wombatail.config.ts')

  const loaded = readConfigFile(created.file)
  assert.deepEqual(loaded.breakpoints, ['xs', 'sm', 'md', 'lg', 'xl'])
  assert.equal(loaded.themeColorTokens.includes('primary'), true)

  // Running init twice must not overwrite an existing config.
  const again = initConfig({ cwd: dir })
  assert.equal(again.created, false)
  assert.equal(again.file, created.file)
})

test('wombatail init --js emits a JavaScript config without type augmentation', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wombatail-init-js-'))
  const { file } = initConfig({ cwd: dir, js: true })
  assert.equal(path.basename(file), 'wombatail.config.js')
  assert.equal(fs.readFileSync(file, 'utf8').includes('declare module'), false)
  assert.deepEqual(readConfigFile(file).breakpoints, ['xs', 'sm', 'md', 'lg', 'xl'])
})
