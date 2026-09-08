'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const { resolveClassName } = require('../src/resolver')
const { normalizeOptions } = require('../src/config')

const options = normalizeOptions({
  allowUnknownThemeColors: false,
  themeColorTokens: ['background', 'surface', 'foreground', 'primary', 'border'],
})
const tokens = [
  'flex-row','flex-col','items-center','justify-between','p-0','p-2','px-4','py-3','mt-2','-mb-1',
  'gap-2','w-full','w-1/2','size-12','rounded-xl','rounded-t-sm','border','border-t-2','border-primary',
  'bg-surface','text-foreground','opacity-50','z-10','md:px-6','ios:mt-4','native:bg-background','object-cover',
]

function rng(seed) {
  let x = seed >>> 0
  return () => {
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5
    return (x >>> 0) / 0x100000000
  }
}

test('deterministic fuzz: supported class combinations never become unsupported', () => {
  const random = rng(0x51A17)
  for (let i = 0; i < 2500; i += 1) {
    const count = 1 + Math.floor(random() * 12)
    const list = Array.from({ length: count }, () => tokens[Math.floor(random() * tokens.length)])
    const a = resolveClassName(list.join(' '), options)
    const b = resolveClassName(list.join(' '), options)
    assert.equal(a.unsupported.length, 0)
    assert.deepEqual(a, b)
  }
})
