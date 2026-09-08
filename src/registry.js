'use strict'

function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`
}

class StyleRegistry {
  constructor() {
    this.entries = []
    this.cache = new Map()
    this.platformUsed = false
  }

  add(style) {
    const cacheKey = stableStringify(style)
    const found = this.cache.get(cacheKey)
    if (found) return found
    const key = `_u${this.entries.length}`
    this.entries.push({ key, style })
    this.cache.set(cacheKey, key)
    return key
  }

  markPlatformUsed() {
    this.platformUsed = true
  }
}

module.exports = { StyleRegistry, stableStringify }
