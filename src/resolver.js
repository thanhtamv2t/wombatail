'use strict'

const { literal, theme, breakpoint, toCamelCase } = require('./values')

const SPACE = Object.freeze({
  '0': 0, px: 1, '0.5': 2, '1': 4, '1.5': 6, '2': 8, '2.5': 10, '3': 12, '3.5': 14,
  '4': 16, '5': 20, '6': 24, '7': 28, '8': 32, '9': 36, '10': 40, '11': 44, '12': 48,
  '14': 56, '16': 64, '20': 80, '24': 96, '28': 112, '32': 128, '36': 144, '40': 160,
  '44': 176, '48': 192, '52': 208, '56': 224, '60': 240, '64': 256, '72': 288, '80': 320,
  '96': 384,
})

const ALL_PADDING = ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft']
const ALL_MARGIN = ['marginTop', 'marginRight', 'marginBottom', 'marginLeft']
const ALL_BORDER_WIDTH = ['borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth']
const ALL_BORDER_COLOR = ['borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor']
const ALL_RADIUS = ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius']

function styleFromProps(props, value) {
  return Object.fromEntries(props.map((prop) => [prop, literal(value)]))
}

function radiusStyle(value) {
  return styleFromProps(ALL_RADIUS, value)
}

function borderWidthStyle(value) {
  return styleFromProps(ALL_BORDER_WIDTH, value)
}

const STATIC = Object.freeze({
  flex: { display: literal('flex') },
  hidden: { display: literal('none') },
  'flex-1': { flex: literal(1) },
  'flex-row': { flexDirection: literal('row') },
  'flex-row-reverse': { flexDirection: literal('row-reverse') },
  'flex-col': { flexDirection: literal('column') },
  'flex-col-reverse': { flexDirection: literal('column-reverse') },
  'flex-wrap': { flexWrap: literal('wrap') },
  'flex-wrap-reverse': { flexWrap: literal('wrap-reverse') },
  'flex-nowrap': { flexWrap: literal('nowrap') },
  grow: { flexGrow: literal(1) },
  'grow-0': { flexGrow: literal(0) },
  shrink: { flexShrink: literal(1) },
  'shrink-0': { flexShrink: literal(0) },

  'items-start': { alignItems: literal('flex-start') },
  'items-center': { alignItems: literal('center') },
  'items-end': { alignItems: literal('flex-end') },
  'items-stretch': { alignItems: literal('stretch') },
  'items-baseline': { alignItems: literal('baseline') },
  'justify-start': { justifyContent: literal('flex-start') },
  'justify-center': { justifyContent: literal('center') },
  'justify-end': { justifyContent: literal('flex-end') },
  'justify-between': { justifyContent: literal('space-between') },
  'justify-around': { justifyContent: literal('space-around') },
  'justify-evenly': { justifyContent: literal('space-evenly') },
  'content-start': { alignContent: literal('flex-start') },
  'content-center': { alignContent: literal('center') },
  'content-end': { alignContent: literal('flex-end') },
  'content-between': { alignContent: literal('space-between') },
  'content-around': { alignContent: literal('space-around') },
  'content-stretch': { alignContent: literal('stretch') },
  'self-auto': { alignSelf: literal('auto') },
  'self-start': { alignSelf: literal('flex-start') },
  'self-center': { alignSelf: literal('center') },
  'self-end': { alignSelf: literal('flex-end') },
  'self-stretch': { alignSelf: literal('stretch') },

  relative: { position: literal('relative') },
  absolute: { position: literal('absolute') },
  'overflow-hidden': { overflow: literal('hidden') },
  'overflow-visible': { overflow: literal('visible') },
  'overflow-scroll': { overflow: literal('scroll') },
  'backface-visible': { backfaceVisibility: literal('visible') },
  'backface-hidden': { backfaceVisibility: literal('hidden') },

  'w-full': { width: literal('100%') },
  'h-full': { height: literal('100%') },
  'w-auto': { width: literal('auto') },
  'h-auto': { height: literal('auto') },
  'min-w-full': { minWidth: literal('100%') },
  'max-w-full': { maxWidth: literal('100%') },
  'min-h-full': { minHeight: literal('100%') },
  'max-h-full': { maxHeight: literal('100%') },
  'size-full': { width: literal('100%'), height: literal('100%') },
  'aspect-square': { aspectRatio: literal(1) },
  'aspect-video': { aspectRatio: literal(16 / 9) },

  'rounded-none': radiusStyle(0),
  'rounded-sm': radiusStyle(2),
  rounded: radiusStyle(4),
  'rounded-md': radiusStyle(6),
  'rounded-lg': radiusStyle(8),
  'rounded-xl': radiusStyle(12),
  'rounded-2xl': radiusStyle(16),
  'rounded-3xl': radiusStyle(24),
  'rounded-full': radiusStyle(9999),

  border: borderWidthStyle(1),
  'border-0': borderWidthStyle(0),
  'border-2': borderWidthStyle(2),
  'border-4': borderWidthStyle(4),
  'border-8': borderWidthStyle(8),
  'border-solid': { borderStyle: literal('solid') },
  'border-dashed': { borderStyle: literal('dashed') },
  'border-dotted': { borderStyle: literal('dotted') },

  'text-xs': { fontSize: literal(12), lineHeight: literal(16) },
  'text-sm': { fontSize: literal(14), lineHeight: literal(20) },
  'text-base': { fontSize: literal(16), lineHeight: literal(24) },
  'text-lg': { fontSize: literal(18), lineHeight: literal(28) },
  'text-xl': { fontSize: literal(20), lineHeight: literal(28) },
  'text-2xl': { fontSize: literal(24), lineHeight: literal(32) },
  'text-3xl': { fontSize: literal(30), lineHeight: literal(36) },
  'text-4xl': { fontSize: literal(36), lineHeight: literal(40) },
  'font-thin': { fontWeight: literal('100') },
  'font-extralight': { fontWeight: literal('200') },
  'font-light': { fontWeight: literal('300') },
  'font-normal': { fontWeight: literal('400') },
  'font-medium': { fontWeight: literal('500') },
  'font-semibold': { fontWeight: literal('600') },
  'font-bold': { fontWeight: literal('700') },
  'font-extrabold': { fontWeight: literal('800') },
  'font-black': { fontWeight: literal('900') },
  italic: { fontStyle: literal('italic') },
  'not-italic': { fontStyle: literal('normal') },
  'text-left': { textAlign: literal('left') },
  'text-center': { textAlign: literal('center') },
  'text-right': { textAlign: literal('right') },
  'text-justify': { textAlign: literal('justify') },
  uppercase: { textTransform: literal('uppercase') },
  lowercase: { textTransform: literal('lowercase') },
  capitalize: { textTransform: literal('capitalize') },
  'normal-case': { textTransform: literal('none') },
  underline: { textDecorationLine: literal('underline') },
  'line-through': { textDecorationLine: literal('line-through') },
  'no-underline': { textDecorationLine: literal('none') },

  'object-cover': { objectFit: literal('cover') },
  'object-contain': { objectFit: literal('contain') },
  'object-fill': { objectFit: literal('fill') },
  'object-scale-down': { objectFit: literal('scale-down') },

  'bg-transparent': { backgroundColor: literal('transparent') },
  'bg-black': { backgroundColor: literal('#000000') },
  'bg-white': { backgroundColor: literal('#ffffff') },
  'text-transparent': { color: literal('transparent') },
  'text-black': { color: literal('#000000') },
  'text-white': { color: literal('#ffffff') },
  'border-transparent': styleFromProps(ALL_BORDER_COLOR, 'transparent'),
  'border-black': styleFromProps(ALL_BORDER_COLOR, '#000000'),
  'border-white': styleFromProps(ALL_BORDER_COLOR, '#ffffff'),
  'tint-transparent': { tintColor: literal('transparent') },
  'tint-black': { tintColor: literal('#000000') },
  'tint-white': { tintColor: literal('#ffffff') },
})

const SPACING_PROPS = Object.freeze({
  p: ALL_PADDING,
  px: ['paddingLeft', 'paddingRight'],
  py: ['paddingTop', 'paddingBottom'],
  pt: ['paddingTop'], pr: ['paddingRight'], pb: ['paddingBottom'], pl: ['paddingLeft'],
  m: ALL_MARGIN,
  mx: ['marginLeft', 'marginRight'],
  my: ['marginTop', 'marginBottom'],
  mt: ['marginTop'], mr: ['marginRight'], mb: ['marginBottom'], ml: ['marginLeft'],
  gap: ['gap'], 'gap-x': ['columnGap'], 'gap-y': ['rowGap'],
  inset: ['top', 'right', 'bottom', 'left'],
  'inset-x': ['left', 'right'], 'inset-y': ['top', 'bottom'],
  top: ['top'], right: ['right'], bottom: ['bottom'], left: ['left'],
})

const SIZE_PROPS = Object.freeze({
  w: ['width'], h: ['height'], size: ['width', 'height'], basis: ['flexBasis'],
  'min-w': ['minWidth'], 'max-w': ['maxWidth'], 'min-h': ['minHeight'], 'max-h': ['maxHeight'],
})

const BORDER_SIDE_PROPS = Object.freeze({
  'border-t': ['borderTopWidth'], 'border-r': ['borderRightWidth'],
  'border-b': ['borderBottomWidth'], 'border-l': ['borderLeftWidth'],
  'border-x': ['borderLeftWidth', 'borderRightWidth'],
  'border-y': ['borderTopWidth', 'borderBottomWidth'],
})

const ROUND_SIDE_PROPS = Object.freeze({
  'rounded-t': ['borderTopLeftRadius', 'borderTopRightRadius'],
  'rounded-r': ['borderTopRightRadius', 'borderBottomRightRadius'],
  'rounded-b': ['borderBottomLeftRadius', 'borderBottomRightRadius'],
  'rounded-l': ['borderTopLeftRadius', 'borderBottomLeftRadius'],
  'rounded-tl': ['borderTopLeftRadius'], 'rounded-tr': ['borderTopRightRadius'],
  'rounded-bl': ['borderBottomLeftRadius'], 'rounded-br': ['borderBottomRightRadius'],
})

function cloneStyle(style) {
  return Object.fromEntries(Object.entries(style))
}

function decodeArbitraryString(value) {
  let out = ''
  for (let i = 0; i < value.length; i += 1) {
    if (value[i] === '\\' && value[i + 1] === '_') {
      out += '_'
      i += 1
    } else if (value[i] === '_') out += ' '
    else out += value[i]
  }
  return out
}

function parseArbitrary(raw) {
  const match = raw.match(/^\[(.*)\]$/s)
  if (!match) return null
  const encoded = match[1].trim()
  if (!encoded) return null
  const value = decodeArbitraryString(encoded)
  if (/^-?\d+(?:\.\d+)?px$/.test(value)) return Number(value.slice(0, -2))
  if (/^-?\d+(?:\.\d+)?%$/.test(value)) return value
  if (/^-?\d+(?:\.\d+)?$/.test(value)) return Number(value)
  if (value === 'auto') return 'auto'
  if (/^#(?:[\da-f]{3,8})$/i.test(value)) return value
  if (/^(?:rgb|rgba|hsl|hsla)\([^\n]+\)$/i.test(value)) return value
  return null
}

function resolveNumericValue(raw) {
  return Object.prototype.hasOwnProperty.call(SPACE, raw) ? SPACE[raw] : null
}

function parseFraction(raw) {
  const match = raw.match(/^(\d+)\/(\d+)$/)
  if (!match) return null
  const numerator = Number(match[1])
  const denominator = Number(match[2])
  if (!denominator || numerator < 0 || numerator > denominator) return null
  return `${(numerator / denominator) * 100}%`
}

function parseSizeValue(raw) {
  if (raw === 'full') return '100%'
  if (raw === 'auto') return 'auto'
  const arbitrary = parseArbitrary(raw)
  if (arbitrary != null) return arbitrary
  const numeric = resolveNumericValue(raw)
  if (numeric != null) return numeric
  return parseFraction(raw)
}

function resolveSpacing(token) {
  const match = token.match(/^(-)?(p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|gap-x|gap-y|inset|inset-x|inset-y|top|right|bottom|left)-(.+)$/)
  if (!match) return null
  const [, negative, kind, raw] = match
  const arbitrary = parseArbitrary(raw)
  const value = arbitrary == null ? resolveNumericValue(raw) : arbitrary
  if (value == null) return null
  if (negative && (kind.startsWith('p') || kind.startsWith('gap'))) return null
  if (negative && typeof value !== 'number') return null
  return styleFromProps(SPACING_PROPS[kind], negative ? -value : value)
}

function resolveSize(token) {
  const match = token.match(/^(w|h|size|basis|min-w|max-w|min-h|max-h)-(.+)$/)
  if (!match) return null
  const [, kind, raw] = match
  const value = parseSizeValue(raw)
  if (value == null) return null
  return styleFromProps(SIZE_PROPS[kind], value)
}

function resolveOpacity(token) {
  const match = token.match(/^opacity-(\d{1,3})$/)
  if (!match) return null
  const n = Number(match[1])
  return n >= 0 && n <= 100 ? { opacity: literal(n / 100) } : null
}

function resolveZIndex(token) {
  const match = token.match(/^z-(-?\d+)$/)
  return match ? { zIndex: literal(Number(match[1])) } : null
}

function resolveElevation(token) {
  const match = token.match(/^elevation-(\d+(?:\.\d+)?)$/)
  return match ? { elevation: literal(Number(match[1])) } : null
}

function resolveAspect(token) {
  const match = token.match(/^aspect-(\[.*\])$/s)
  if (!match) return null
  const value = parseArbitrary(match[1])
  return typeof value === 'number' && value > 0 ? { aspectRatio: literal(value) } : null
}

function radiusValue(raw) {
  const map = { none: 0, sm: 2, '': 4, md: 6, lg: 8, xl: 12, '2xl': 16, '3xl': 24, full: 9999 }
  if (Object.prototype.hasOwnProperty.call(map, raw)) return map[raw]
  const arbitrary = parseArbitrary(raw)
  return typeof arbitrary === 'number' ? arbitrary : null
}

function resolveArbitraryRounded(token) {
  const match = token.match(/^rounded-(\[.*\])$/s)
  if (!match) return null
  const value = parseArbitrary(match[1])
  return typeof value === 'number' ? radiusStyle(value) : null
}

function resolveSideBorderWidth(token) {
  for (const [prefix, props] of Object.entries(BORDER_SIDE_PROPS)) {
    if (token === prefix) return styleFromProps(props, 1)
    if (token.startsWith(prefix + '-')) {
      const raw = token.slice(prefix.length + 1)
      const arbitrary = parseArbitrary(raw)
      const value = arbitrary == null ? Number(raw) : arbitrary
      if (typeof value === 'number' && Number.isFinite(value)) return styleFromProps(props, value)
    }
  }
  return null
}

function resolveSideRadius(token) {
  for (const [prefix, props] of Object.entries(ROUND_SIDE_PROPS)) {
    if (token === prefix) return styleFromProps(props, 4)
    if (token.startsWith(prefix + '-')) {
      const value = radiusValue(token.slice(prefix.length + 1))
      if (value != null) return styleFromProps(props, value)
    }
  }
  return null
}

function resolveArbitraryText(token) {
  const match = token.match(/^text-(\[.*\])$/s)
  if (!match) return null
  const value = parseArbitrary(match[1])
  if (typeof value === 'number') return { fontSize: literal(value) }
  if (typeof value === 'string' && (value.startsWith('#') || /^(rgb|hsl)/i.test(value))) return { color: literal(value) }
  return null
}

function resolveLeading(token) {
  const match = token.match(/^leading-(\[.*\])$/s)
  if (!match) return null
  const value = parseArbitrary(match[1])
  return typeof value === 'number' ? { lineHeight: literal(value) } : null
}

function resolveTracking(token) {
  const named = {
    'tracking-tighter': -0.8, 'tracking-tight': -0.4, 'tracking-normal': 0,
    'tracking-wide': 0.4, 'tracking-wider': 0.8, 'tracking-widest': 1.6,
  }
  if (Object.prototype.hasOwnProperty.call(named, token)) return { letterSpacing: literal(named[token]) }
  const match = token.match(/^tracking-(\[.*\])$/s)
  if (!match) return null
  const value = parseArbitrary(match[1])
  return typeof value === 'number' ? { letterSpacing: literal(value) } : null
}

function themeColorDescriptor(raw, options) {
  const token = toCamelCase(raw)
  if (!options.allowUnknownThemeColors && (!options.themeColorTokens || !options.themeColorTokens.has(token))) return null
  return theme(['colors', token])
}

function colorDescriptor(raw, options) {
  if (/^\[.*\]$/s.test(raw)) {
    const value = parseArbitrary(raw)
    return typeof value === 'string' ? literal(value) : null
  }
  const literals = { transparent: 'transparent', black: '#000000', white: '#ffffff' }
  if (Object.prototype.hasOwnProperty.call(literals, raw)) return literal(literals[raw])
  return themeColorDescriptor(raw, options)
}

function resolveDirectionalBorderColor(token, options) {
  const directions = {
    'border-t-': ['borderTopColor'], 'border-r-': ['borderRightColor'],
    'border-b-': ['borderBottomColor'], 'border-l-': ['borderLeftColor'],
    'border-x-': ['borderLeftColor', 'borderRightColor'],
    'border-y-': ['borderTopColor', 'borderBottomColor'],
  }
  for (const [prefix, props] of Object.entries(directions)) {
    if (!token.startsWith(prefix)) continue
    const descriptor = colorDescriptor(token.slice(prefix.length), options)
    return descriptor ? Object.fromEntries(props.map((prop) => [prop, descriptor])) : null
  }
  return null
}

function resolveColor(token, options) {
  if (token.startsWith('bg-')) {
    const descriptor = colorDescriptor(token.slice(3), options)
    return descriptor ? { backgroundColor: descriptor } : null
  }
  if (token.startsWith('text-')) {
    const descriptor = colorDescriptor(token.slice(5), options)
    return descriptor ? { color: descriptor } : null
  }
  if (token.startsWith('border-')) {
    const descriptor = colorDescriptor(token.slice(7), options)
    return descriptor ? Object.fromEntries(ALL_BORDER_COLOR.map((prop) => [prop, descriptor])) : null
  }
  if (token.startsWith('tint-')) {
    const descriptor = colorDescriptor(token.slice(5), options)
    return descriptor ? { tintColor: descriptor } : null
  }
  return null
}

function resolveUtility(token, options) {
  if (STATIC[token]) return cloneStyle(STATIC[token])
  return resolveSpacing(token)
    || resolveSize(token)
    || resolveOpacity(token)
    || resolveZIndex(token)
    || resolveElevation(token)
    || resolveAspect(token)
    || resolveArbitraryRounded(token)
    || resolveSideBorderWidth(token)
    || resolveSideRadius(token)
    || resolveArbitraryText(token)
    || resolveLeading(token)
    || resolveTracking(token)
    || resolveDirectionalBorderColor(token, options)
    || resolveColor(token, options)
}

function splitVariantToken(token) {
  let depth = 0
  for (let i = 0; i < token.length; i += 1) {
    const char = token[i]
    if (char === '[') depth += 1
    else if (char === ']') depth = Math.max(0, depth - 1)
    else if (char === ':' && depth === 0) return [token.slice(0, i), token.slice(i + 1)]
  }
  return [null, token]
}

function parseToken(rawToken, options) {
  const variants = []
  let utility = rawToken
  while (true) {
    const [prefix, rest] = splitVariantToken(utility)
    if (!prefix) break
    const isBreakpoint = options.breakpoints.includes(prefix)
    const isPlatform = ['ios', 'android', 'web', 'native'].includes(prefix)
    if (!isBreakpoint && !isPlatform) break
    variants.push({ type: isBreakpoint ? 'breakpoint' : 'platform', value: prefix })
    utility = rest
  }

  const style = resolveUtility(utility, options)
  if (!style) return { unsupported: rawToken }

  let breakpointName = null
  let platformName = null
  for (const variant of variants) {
    if (variant.type === 'breakpoint') {
      if (breakpointName) return { unsupported: rawToken, reason: 'multiple breakpoints in one utility are unsupported' }
      breakpointName = variant.value
    } else {
      if (platformName) return { unsupported: rawToken, reason: 'multiple platform variants in one utility are unsupported' }
      platformName = variant.value
    }
  }

  const wrapped = breakpointName
    ? Object.fromEntries(Object.entries(style).map(([prop, value]) => [prop, breakpoint(breakpointName, value)]))
    : style

  return { raw: rawToken, style: wrapped, platform: platformName, breakpoint: breakpointName }
}

function tokenizeClassName(className) {
  const tokens = []
  let current = ''
  let depth = 0
  let escaped = false
  for (const char of className.trim()) {
    if (escaped) {
      current += char
      escaped = false
      continue
    }
    if (char === '\\') {
      current += char
      escaped = true
      continue
    }
    if (char === '[') depth += 1
    else if (char === ']') depth = Math.max(0, depth - 1)
    if (/\s/.test(char) && depth === 0) {
      if (current) tokens.push(current)
      current = ''
    } else current += char
  }
  if (current) tokens.push(current)
  return tokens
}

function resolveClassName(className, options) {
  const tokens = tokenizeClassName(className)
  const chunks = []
  const unsupported = []
  let current = null

  function flush() {
    if (current && Object.keys(current.style).length) chunks.push(current)
    current = null
  }

  for (const raw of tokens) {
    const resolved = parseToken(raw, options)
    if (resolved.unsupported) {
      unsupported.push({ token: raw, reason: resolved.reason || 'unsupported utility or variant' })
      flush()
      continue
    }
    const key = `${resolved.platform || 'all'}|${resolved.breakpoint || 'base'}`
    if (!current || current.key !== key) {
      flush()
      current = { key, platform: resolved.platform || null, style: {} }
    }
    Object.assign(current.style, resolved.style)
  }
  flush()
  return { chunks, unsupported }
}

module.exports = {
  SPACE, STATIC, parseArbitrary, parseToken, resolveClassName, resolveUtility, tokenizeClassName,
}
