'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const { normalizeOptions } = require('../src/config')
const { resolveClassName, resolveUtility, parseArbitrary, parseToken, tokenizeClassName } = require('../src/resolver')

const options = normalizeOptions()

function plain(style) {
  const out = {}
  for (const [key, descriptor] of Object.entries(style)) {
    if (descriptor.kind === 'literal') out[key] = descriptor.value
    else if (descriptor.kind === 'theme') out[key] = `theme.${descriptor.path.join('.')}`
    else if (descriptor.kind === 'breakpoint') {
      const inner = descriptor.value.kind === 'literal'
        ? descriptor.value.value
        : `theme.${descriptor.value.path.join('.')}`
      out[key] = { [descriptor.name]: inner }
    }
  }
  return out
}

const radius12 = {
  borderTopLeftRadius: 12, borderTopRightRadius: 12,
  borderBottomRightRadius: 12, borderBottomLeftRadius: 12,
}

const borderPrimary = {
  borderTopColor: 'theme.colors.primary', borderRightColor: 'theme.colors.primary',
  borderBottomColor: 'theme.colors.primary', borderLeftColor: 'theme.colors.primary',
}

test('resolves layout with deterministic physical spacing/radius props', () => {
  const { chunks, unsupported } = resolveClassName('flex-row items-center gap-2 px-4 py-3 rounded-xl', options)
  assert.equal(unsupported.length, 0)
  assert.equal(chunks.length, 1)
  assert.deepEqual(plain(chunks[0].style), {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 12,
    ...radius12,
  })
})

test('left-to-right spacing precedence is deterministic', () => {
  const { chunks } = resolveClassName('p-2 p-4 px-8', options)
  assert.deepEqual(plain(chunks[0].style), {
    paddingTop: 16, paddingRight: 32, paddingBottom: 16, paddingLeft: 32,
  })
})

test('left-to-right border/radius precedence is deterministic', () => {
  const { chunks } = resolveClassName('border-4 border-t-2 rounded-xl rounded-t-sm', options)
  assert.deepEqual(plain(chunks[0].style), {
    borderTopWidth: 2, borderRightWidth: 4, borderBottomWidth: 4, borderLeftWidth: 4,
    borderTopLeftRadius: 2, borderTopRightRadius: 2,
    borderBottomRightRadius: 12, borderBottomLeftRadius: 12,
  })
})

test('semantic colors target Unistyles theme', () => {
  assert.deepEqual(plain(resolveUtility('bg-background', options)), { backgroundColor: 'theme.colors.background' })
  assert.deepEqual(plain(resolveUtility('text-muted-foreground', options)), { color: 'theme.colors.mutedForeground' })
  assert.deepEqual(plain(resolveUtility('border-primary', options)), borderPrimary)
  assert.deepEqual(plain(resolveUtility('tint-primary', options)), { tintColor: 'theme.colors.primary' })
})

test('built-in black white transparent remain literals', () => {
  assert.deepEqual(plain(resolveUtility('bg-black', options)), { backgroundColor: '#000000' })
  assert.deepEqual(plain(resolveUtility('text-white', options)), { color: '#ffffff' })
  assert.deepEqual(plain(resolveUtility('border-transparent', options)), {
    borderTopColor: 'transparent', borderRightColor: 'transparent',
    borderBottomColor: 'transparent', borderLeftColor: 'transparent',
  })
})

test('arbitrary native values work for spacing, sizing, radius and colors', () => {
  assert.deepEqual(plain(resolveUtility('w-[137px]', options)), { width: 137 })
  assert.deepEqual(plain(resolveUtility('h-[50%]', options)), { height: '50%' })
  assert.deepEqual(plain(resolveUtility('rounded-[13px]', options)), {
    borderTopLeftRadius: 13, borderTopRightRadius: 13,
    borderBottomRightRadius: 13, borderBottomLeftRadius: 13,
  })
  assert.deepEqual(plain(resolveUtility('text-[18px]', options)), { fontSize: 18 })
  assert.deepEqual(plain(resolveUtility('bg-[#123456]', options)), { backgroundColor: '#123456' })
  assert.deepEqual(plain(resolveUtility('bg-[rgb(1_2_3)]', options)), { backgroundColor: 'rgb(1 2 3)' })
})

test('negative margin/position works but negative padding is rejected', () => {
  assert.deepEqual(plain(resolveUtility('-mt-2', options)), { marginTop: -8 })
  assert.deepEqual(plain(resolveUtility('-left-[12px]', options)), { left: -12 })
  assert.equal(resolveUtility('-px-2', options), null)
})

test('breakpoint utility becomes Unistyles breakpoint values', () => {
  const parsed = parseToken('md:px-6', options)
  assert.equal(parsed.breakpoint, 'md')
  assert.deepEqual(plain(parsed.style), { paddingLeft: { md: 24 }, paddingRight: { md: 24 } })
})

test('platform and breakpoint can stack', () => {
  const parsed = parseToken('ios:md:bg-primary', options)
  assert.equal(parsed.platform, 'ios')
  assert.equal(parsed.breakpoint, 'md')
  assert.deepEqual(plain(parsed.style), { backgroundColor: { md: 'theme.colors.primary' } })
})

test('condition changes preserve source order as separate chunks', () => {
  const { chunks } = resolveClassName('p-2 ios:p-4 p-3 md:p-8', options)
  assert.equal(chunks.length, 4)
  assert.deepEqual(chunks.map((chunk) => chunk.platform), [null, 'ios', null, null])
  assert.deepEqual(plain(chunks[0].style), { paddingTop: 8, paddingRight: 8, paddingBottom: 8, paddingLeft: 8 })
  assert.deepEqual(plain(chunks[1].style), { paddingTop: 16, paddingRight: 16, paddingBottom: 16, paddingLeft: 16 })
  assert.deepEqual(plain(chunks[2].style), { paddingTop: 12, paddingRight: 12, paddingBottom: 12, paddingLeft: 12 })
  assert.deepEqual(plain(chunks[3].style), {
    paddingTop: { md: 32 }, paddingRight: { md: 32 }, paddingBottom: { md: 32 }, paddingLeft: { md: 32 },
  })
})

test('unknown variants/utilities are surfaced', () => {
  const { unsupported } = resolveClassName('hover:bg-primary grid-cols-3', options)
  assert.deepEqual(unsupported.map((x) => x.token), ['hover:bg-primary', 'grid-cols-3'])
})

test('parseArbitrary supports native-safe scalar values and Tailwind underscore spaces', () => {
  assert.equal(parseArbitrary('[12px]'), 12)
  assert.equal(parseArbitrary('[-1.5]'), -1.5)
  assert.equal(parseArbitrary('[33%]'), '33%')
  assert.equal(parseArbitrary('[auto]'), 'auto')
  assert.equal(parseArbitrary('[#fff]'), '#fff')
  assert.equal(parseArbitrary('[rgb(1_2_3)]'), 'rgb(1 2 3)')
  assert.equal(parseArbitrary('[calc(100%-2px)]'), null)
})

test('tokenizer does not split whitespace inside arbitrary brackets', () => {
  assert.deepEqual(tokenizeClassName('p-4 bg-[rgb(1 2 3)] rounded-xl'), ['p-4', 'bg-[rgb(1 2 3)]', 'rounded-xl'])
})

test('strict theme color mode rejects undeclared semantic token', () => {
  const strict = normalizeOptions({ allowUnknownThemeColors: false, themeColorTokens: ['primary', 'background'] })
  assert.ok(resolveUtility('bg-primary', strict))
  assert.equal(resolveUtility('bg-unknown', strict), null)
})

test('size/basis support spacing, fraction, arbitrary and full', () => {
  assert.deepEqual(plain(resolveUtility('size-12', options)), { width: 48, height: 48 })
  assert.deepEqual(plain(resolveUtility('size-[18px]', options)), { width: 18, height: 18 })
  assert.deepEqual(plain(resolveUtility('basis-1/2', options)), { flexBasis: '50%' })
  assert.deepEqual(plain(resolveUtility('w-1/3', options)), { width: `${(1 / 3) * 100}%` })
  assert.deepEqual(plain(resolveUtility('max-w-full', options)), { maxWidth: '100%' })
})

test('directional border width and colors', () => {
  assert.deepEqual(plain(resolveUtility('border-x-2', options)), { borderLeftWidth: 2, borderRightWidth: 2 })
  assert.deepEqual(plain(resolveUtility('border-t-primary', options)), { borderTopColor: 'theme.colors.primary' })
  assert.deepEqual(plain(resolveUtility('border-y-[#112233]', options)), { borderTopColor: '#112233', borderBottomColor: '#112233' })
})

test('common production-safe native utilities', () => {
  assert.deepEqual(plain(resolveUtility('elevation-6', options)), { elevation: 6 })
  assert.deepEqual(plain(resolveUtility('object-cover', options)), { objectFit: 'cover' })
  assert.deepEqual(plain(resolveUtility('underline', options)), { textDecorationLine: 'underline' })
  assert.deepEqual(plain(resolveUtility('border-dashed', options)), { borderStyle: 'dashed' })
})
