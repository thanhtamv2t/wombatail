'use strict'

const fs = require('node:fs')
const path = require('node:path')
const parser = require('@babel/parser')

const CONFIG_BASENAMES = Object.freeze([
  'wombatail.config.ts',
  'wombatail.config.mts',
  'wombatail.config.cts',
  'wombatail.config.js',
  'wombatail.config.mjs',
  'wombatail.config.cjs',
])

const DEFINE_NAME = 'defineWombatailConfig'
const RUNTIME_SPECIFIERS = new Set(['babel-plugin-wombatail/runtime', 'wombatail/runtime'])

// A "no config here" answer is only cached briefly so a config created while the
// bundler is already running gets picked up without a restart.
const MISS_TTL_MS = 2000

const lookupCache = new Map()
const parseCache = new Map()

function configFileInDir(dir) {
  for (const base of CONFIG_BASENAMES) {
    const candidate = path.join(dir, base)
    if (fs.existsSync(candidate)) return candidate
  }
  return null
}

function findConfigFile(startDir) {
  if (!startDir) return null
  const key = path.resolve(startDir)
  const cached = lookupCache.get(key)
  if (cached !== undefined) {
    // A cached hit is only trusted while the file still exists; deletions must re-search.
    if (cached.file && fs.existsSync(cached.file)) return cached.file
    if (!cached.file && Date.now() - cached.at < MISS_TTL_MS) return null
    lookupCache.delete(key)
  }

  let dir = key
  for (;;) {
    const found = configFileInDir(dir)
    if (found) {
      lookupCache.set(key, { file: found, at: Date.now() })
      return found
    }
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  lookupCache.set(key, { file: null, at: Date.now() })
  return null
}

function unwrap(node) {
  let current = node
  for (;;) {
    if (!current) return current
    switch (current.type) {
      case 'TSAsExpression':
      case 'TSSatisfiesExpression':
      case 'TSNonNullExpression':
      case 'TSTypeAssertion':
      case 'ParenthesizedExpression':
        current = current.expression
        break
      default:
        return current
    }
  }
}

class StaticEvalError extends Error {}

function evaluateNode(node, constants) {
  const target = unwrap(node)
  if (!target) throw new StaticEvalError('empty expression')

  switch (target.type) {
    case 'StringLiteral':
    case 'NumericLiteral':
    case 'BooleanLiteral':
      return target.value
    case 'NullLiteral':
      return null
    case 'TemplateLiteral':
      if (target.expressions.length) throw new StaticEvalError('template literal with interpolation')
      return target.quasis.map((quasi) => quasi.value.cooked).join('')
    case 'UnaryExpression': {
      if (target.operator !== '-' && target.operator !== '+') throw new StaticEvalError(`unary ${target.operator}`)
      const value = evaluateNode(target.argument, constants)
      if (typeof value !== 'number') throw new StaticEvalError('unary operator on a non-number')
      return target.operator === '-' ? -value : value
    }
    case 'ArrayExpression':
      return target.elements.map((element) => {
        if (!element) throw new StaticEvalError('array hole')
        if (element.type === 'SpreadElement') throw new StaticEvalError('array spread')
        return evaluateNode(element, constants)
      })
    case 'ObjectExpression': {
      const result = {}
      for (const property of target.properties) {
        if (property.type === 'SpreadElement') {
          Object.assign(result, evaluateNode(property.argument, constants))
          continue
        }
        if (property.type !== 'ObjectProperty') throw new StaticEvalError('object method')
        const key = property.key
        let name
        if (property.computed) {
          const computed = evaluateNode(key, constants)
          if (typeof computed !== 'string' && typeof computed !== 'number') throw new StaticEvalError('computed key')
          name = String(computed)
        } else if (key.type === 'Identifier') name = key.name
        else if (key.type === 'StringLiteral') name = key.value
        else if (key.type === 'NumericLiteral') name = String(key.value)
        else throw new StaticEvalError('unsupported object key')
        result[name] = evaluateNode(property.value, constants)
      }
      return result
    }
    case 'Identifier': {
      if (!constants.has(target.name)) throw new StaticEvalError(`identifier "${target.name}" is not a top-level const literal`)
      return evaluateNode(constants.get(target.name), constants)
    }
    case 'CallExpression': {
      const callee = unwrap(target.callee)
      if (callee.type !== 'Identifier' || callee.name !== DEFINE_NAME) throw new StaticEvalError('function call')
      if (!target.arguments.length) throw new StaticEvalError(`${DEFINE_NAME}() without an argument`)
      return evaluateNode(target.arguments[0], constants)
    }
    default:
      throw new StaticEvalError(`${target.type} is not statically analyzable`)
  }
}

function collectTopLevelConstants(program) {
  const constants = new Map()
  for (const statement of program.body) {
    const declaration = statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement
    if (!declaration || declaration.type !== 'VariableDeclaration' || declaration.kind !== 'const') continue
    for (const declarator of declaration.declarations) {
      if (declarator.id.type === 'Identifier' && declarator.init) constants.set(declarator.id.name, declarator.init)
    }
  }
  return constants
}

function defineLocalName(program) {
  for (const statement of program.body) {
    if (statement.type !== 'ImportDeclaration') continue
    if (!RUNTIME_SPECIFIERS.has(statement.source.value)) continue
    for (const specifier of statement.specifiers) {
      if (specifier.type === 'ImportSpecifier' && specifier.imported.name === DEFINE_NAME) return specifier.local.name
    }
  }
  return null
}

function findDefineCall(node, localName, seen) {
  if (!node || typeof node !== 'object') return null
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findDefineCall(item, localName, seen)
      if (found) return found
    }
    return null
  }
  if (!node.type || seen.has(node)) return null
  seen.add(node)
  if (node.type === 'CallExpression') {
    const callee = unwrap(node.callee)
    if (callee && callee.type === 'Identifier' && (callee.name === localName || callee.name === DEFINE_NAME)) return node
  }
  for (const key of Object.keys(node)) {
    if (key === 'loc' || key === 'leadingComments' || key === 'trailingComments') continue
    const found = findDefineCall(node[key], localName, seen)
    if (found) return found
  }
  return null
}

function findExportedConfigNode(program) {
  const localName = defineLocalName(program)
  const call = findDefineCall(program.body, localName, new Set())
  if (call) {
    if (!call.arguments.length) throw new StaticEvalError(`${DEFINE_NAME}() without an argument`)
    return call.arguments[0]
  }

  for (const statement of program.body) {
    if (statement.type === 'ExportDefaultDeclaration') return statement.declaration
    if (
      statement.type === 'ExpressionStatement'
      && statement.expression.type === 'AssignmentExpression'
      && statement.expression.operator === '='
    ) {
      const left = statement.expression.left
      if (
        left.type === 'MemberExpression'
        && left.object.type === 'Identifier'
        && left.object.name === 'module'
        && left.property.type === 'Identifier'
        && left.property.name === 'exports'
      ) return statement.expression.right
    }
  }
  return null
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function extractCompilerOptions(config, configPath) {
  if (!isPlainObject(config)) {
    throw new TypeError(`[Wombatail] ${configPath} must export a configuration object.`)
  }

  const breakpoints = isPlainObject(config.breakpoints) ? Object.keys(config.breakpoints) : null

  const tokens = new Set()
  if (isPlainObject(config.themes)) {
    for (const theme of Object.values(config.themes)) {
      if (!isPlainObject(theme) || !isPlainObject(theme.colors)) continue
      for (const [name, value] of Object.entries(theme.colors)) {
        // Only leaf color values map onto a semantic bg-/text-/border-/tint- token.
        if (typeof value === 'string' || typeof value === 'number') tokens.add(name)
      }
    }
  }

  return {
    path: configPath,
    breakpoints: breakpoints && breakpoints.length ? breakpoints : null,
    themeColorTokens: tokens.size ? [...tokens] : null,
  }
}

function readConfigFile(configPath) {
  const stat = fs.statSync(configPath)
  const cached = parseCache.get(configPath)
  if (cached && cached.mtimeMs === stat.mtimeMs && cached.size === stat.size) return cached.value

  const code = fs.readFileSync(configPath, 'utf8')
  const isTypeScript = /\.[cm]?ts$/.test(configPath)
  let program
  try {
    program = parser.parse(code, {
      sourceType: 'module',
      allowReturnOutsideFunction: true,
      plugins: isTypeScript ? ['typescript'] : [],
    }).program
  } catch (parseError) {
    throw new TypeError(`[Wombatail] Failed to parse ${configPath}: ${parseError.message}`)
  }

  let value
  try {
    const node = findExportedConfigNode(program)
    if (!node) {
      throw new StaticEvalError(`no ${DEFINE_NAME}() call, default export, or module.exports assignment`)
    }
    value = extractCompilerOptions(evaluateNode(node, collectTopLevelConstants(program)), configPath)
  } catch (error) {
    if (error instanceof StaticEvalError) {
      throw new TypeError(
        `[Wombatail] ${configPath} is not statically analyzable (${error.message}). `
        + 'The compiler reads themes/breakpoints without executing the file, so keep them inline object literals. '
        + 'For a dynamic config, set configFile: false in the Wombatail Babel options and pass breakpoints/themeColorTokens directly.',
      )
    }
    throw error
  }

  parseCache.set(configPath, { mtimeMs: stat.mtimeMs, size: stat.size, value })
  return value
}

/**
 * Resolve wombatail.config.* and fold it into the Babel plugin options.
 * Explicit plugin options always win over the config file.
 */
function withConfigFile(options = {}, { root, filename } = {}) {
  const configFile = options.configFile
  if (configFile === false) {
    const next = { ...options }
    delete next.configFile
    return { options: next, path: null }
  }
  if (configFile != null && typeof configFile !== 'string' && configFile !== true) {
    throw new TypeError('[Wombatail] configFile must be false, true, or a path string.')
  }

  let configPath = null
  if (typeof configFile === 'string') {
    configPath = path.isAbsolute(configFile) ? configFile : path.resolve(root || process.cwd(), configFile)
    if (!fs.existsSync(configPath)) {
      throw new TypeError(`[Wombatail] configFile not found: ${configPath}`)
    }
  } else {
    configPath = findConfigFile(root || process.cwd())
      || (filename ? findConfigFile(path.dirname(filename)) : null)
  }

  const next = { ...options }
  delete next.configFile
  if (!configPath) {
    if (configFile === true) {
      throw new TypeError('[Wombatail] configFile: true was set but no wombatail.config.{ts,js,mjs,cjs} was found.')
    }
    return { options: next, path: null }
  }

  const loaded = readConfigFile(configPath)
  if (next.breakpoints == null && loaded.breakpoints) next.breakpoints = loaded.breakpoints
  if (next.themeColorTokens == null && loaded.themeColorTokens) {
    next.themeColorTokens = loaded.themeColorTokens
    // Tokens are now a known, complete set, so typos should fail the build unless opted out.
    if (next.allowUnknownThemeColors == null) next.allowUnknownThemeColors = false
  }
  return { options: next, path: configPath }
}

module.exports = {
  CONFIG_BASENAMES,
  configFileInDir,
  findConfigFile,
  readConfigFile,
  withConfigFile,
}
