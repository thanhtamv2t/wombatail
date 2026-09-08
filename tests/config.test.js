'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const { normalizeOptions } = require('../src/config')

test('production strict colors require a token allow-list', () => {
  assert.throws(() => normalizeOptions({ allowUnknownThemeColors: false }), /requires themeColorTokens/)
})

test('config arrays are deduplicated and copied', () => {
  const out = normalizeOptions({ breakpoints: ['xs', 'md', 'md'], mergeFunctions: ['cn', 'cn'] })
  assert.deepEqual(out.breakpoints, ['xs', 'md'])
  assert.deepEqual(out.mergeFunctions, ['cn'])
})

test('invalid plugin option shapes fail early', () => {
  assert.throws(() => normalizeOptions([]), /must be an object/)
  assert.throws(() => normalizeOptions({ breakpoints: [] }), /breakpoints/)
})
