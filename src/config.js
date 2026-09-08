'use strict'

const DEFAULT_BREAKPOINTS = Object.freeze(['xs', 'sm', 'md', 'lg', 'xl', '2xl'])
const DEFAULT_MERGE_FUNCTIONS = Object.freeze(['cn', 'clsx', 'cx', 'twMerge'])

function normalizeStringArray(value, fallback, name) {
  if (value == null) return [...fallback]
  if (!Array.isArray(value) || !value.length || value.some((item) => typeof item !== 'string' || !item.trim())) {
    throw new TypeError(`[Wombatail] ${name} must be a non-empty string array.`)
  }
  return [...new Set(value.map((item) => item.trim()))]
}

function normalizeOptions(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('[Wombatail] Babel plugin options must be an object.')
  }

  const breakpoints = normalizeStringArray(input.breakpoints, DEFAULT_BREAKPOINTS, 'breakpoints')
  const mergeFunctions = normalizeStringArray(input.mergeFunctions, DEFAULT_MERGE_FUNCTIONS, 'mergeFunctions')
  const themeColorTokens = input.themeColorTokens == null
    ? null
    : new Set(normalizeStringArray(input.themeColorTokens, [], 'themeColorTokens'))
  const allowUnknownThemeColors = input.allowUnknownThemeColors !== false

  if (!allowUnknownThemeColors && !themeColorTokens) {
    throw new TypeError('[Wombatail] allowUnknownThemeColors=false requires themeColorTokens so semantic color typos fail at build time.')
  }

  return {
    breakpoints,
    mergeFunctions,
    failOnUnsupported: input.failOnUnsupported !== false,
    allowUnknownThemeColors,
    themeColorTokens,
    allowJsxSpread: input.allowJsxSpread === true,
    evaluateConstBindings: input.evaluateConstBindings !== false,
    debug: input.debug === true,
  }
}

module.exports = {
  DEFAULT_BREAKPOINTS,
  DEFAULT_MERGE_FUNCTIONS,
  normalizeOptions,
}
