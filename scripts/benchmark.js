'use strict'
const { performance } = require('node:perf_hooks')
const { resolveClassName } = require('../src/resolver')
const { normalizeOptions } = require('../src/config')
const options = normalizeOptions({
  allowUnknownThemeColors: false,
  themeColorTokens: ['background', 'surface', 'foreground', 'mutedForeground', 'primary', 'border'],
})
const sample = 'flex-row items-center gap-3 px-4 py-3 rounded-2xl bg-surface border border-primary md:px-6 ios:mt-4'
const iterations = Number(process.env.WOMBATAIL_BENCH_ITERS || 100000)
for (let i = 0; i < 5000; i += 1) resolveClassName(sample, options)
const start = performance.now()
for (let i = 0; i < iterations; i += 1) resolveClassName(sample, options)
const elapsed = performance.now() - start
console.log(JSON.stringify({ iterations, elapsedMs: Number(elapsed.toFixed(2)), opsPerSecond: Math.round(iterations / (elapsed / 1000)) }, null, 2))
