'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const { StyleRegistry, stableStringify } = require('../src/registry')
const { literal, theme, breakpoint } = require('../src/values')

test('registry deduplicates structurally identical styles', () => {
  const registry = new StyleRegistry()
  const a = registry.add({ padding: literal(16), color: theme(['colors', 'primary']) })
  const b = registry.add({ color: theme(['colors', 'primary']), padding: literal(16) })
  assert.equal(a, b)
  assert.equal(registry.entries.length, 1)
})

test('different breakpoint descriptors do not collide', () => {
  const registry = new StyleRegistry()
  const a = registry.add({ padding: breakpoint('sm', literal(16)) })
  const b = registry.add({ padding: breakpoint('md', literal(16)) })
  assert.notEqual(a, b)
})

test('stable stringify sorts object keys', () => {
  assert.equal(stableStringify({ b: 2, a: 1 }), stableStringify({ a: 1, b: 2 }))
})
