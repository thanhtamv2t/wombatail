'use strict'

const { resolveClassName } = require('./resolver')

function isMergeFunction(node, t, options) {
  if (!t.isCallExpression(node)) return false
  return t.isIdentifier(node.callee) && options.mergeFunctions.includes(node.callee.name)
}

function unwrapStaticExpression(node, t) {
  let current = node
  while (current) {
    if (t.isTSAsExpression && t.isTSAsExpression(current)) current = current.expression
    else if (t.isTSSatisfiesExpression && t.isTSSatisfiesExpression(current)) current = current.expression
    else if (t.isTypeCastExpression && t.isTypeCastExpression(current)) current = current.expression
    else if (t.isParenthesizedExpression && t.isParenthesizedExpression(current)) current = current.expression
    else break
  }
  return current
}

function createExpressionCompiler({ t, options, registry, stylesLocal, platformLocal, error }) {
  const activeBindings = new Set()

  function styleRef(style) {
    const key = registry.add(style)
    return t.memberExpression(stylesLocal, t.identifier(key))
  }

  function platformCondition(name) {
    registry.markPlatformUsed()
    const os = t.memberExpression(platformLocal, t.identifier('OS'))
    if (name === 'native') return t.binaryExpression('!==', os, t.stringLiteral('web'))
    return t.binaryExpression('===', os, t.stringLiteral(name))
  }

  function compileClassString(value, nodeForError) {
    if (!value || !value.trim()) return null
    const { chunks, unsupported } = resolveClassName(value, options)
    if (unsupported.length && options.failOnUnsupported) {
      const details = unsupported.map(({ token, reason }) => `${token} (${reason})`).join(', ')
      throw error(nodeForError, `[Wombatail] Unsupported class utilities: ${details}`)
    }

    const expressions = []
    for (const chunk of chunks) {
      const ref = styleRef(chunk.style)
      expressions.push(chunk.platform
        ? t.logicalExpression('&&', platformCondition(chunk.platform), ref)
        : ref)
    }

    if (!expressions.length) return null
    return expressions.length === 1 ? expressions[0] : t.arrayExpression(expressions)
  }

  function combine(expressions) {
    const flat = []
    for (const expr of expressions.filter(Boolean)) {
      if (t.isArrayExpression(expr)) flat.push(...expr.elements.filter(Boolean))
      else flat.push(expr)
    }
    if (!flat.length) return null
    return flat.length === 1 ? flat[0] : t.arrayExpression(flat)
  }

  function compileObjectExpression(node, scope) {
    const out = []
    for (const prop of node.properties) {
      if (!t.isObjectProperty(prop) || prop.computed) {
        throw error(prop, '[Wombatail] clsx/cn object form only supports plain object properties.')
      }
      let className = null
      if (t.isStringLiteral(prop.key)) className = prop.key.value
      else if (t.isIdentifier(prop.key)) className = prop.key.name
      if (!className) throw error(prop, '[Wombatail] Unable to read class name from object key.')
      const compiled = compileClassString(className, prop)
      if (compiled) out.push(t.logicalExpression('&&', prop.value, compiled))
    }
    return combine(out)
  }

  function compileConstIdentifier(node, scope) {
    if (!options.evaluateConstBindings || !scope || !t.isIdentifier(node)) return null
    if (node.name === 'undefined') return null
    const binding = scope.getBinding && scope.getBinding(node.name)
    if (!binding || !binding.constant || !binding.path || !binding.path.isVariableDeclarator()) return null
    const init = binding.path.node.init
    if (!init) return null
    const key = `${binding.scope.uid || 'scope'}:${node.name}`
    if (activeBindings.has(key)) throw error(node, `[Wombatail] Circular static className binding detected for ${node.name}.`)
    activeBindings.add(key)
    try {
      return compile(init, binding.path.scope || scope)
    } finally {
      activeBindings.delete(key)
    }
  }

  function compile(node, scope) {
    node = unwrapStaticExpression(node, t)
    if (!node) return null
    if (t.isStringLiteral(node)) return compileClassString(node.value, node)
    if (t.isNullLiteral(node) || t.isBooleanLiteral(node)) return null

    if (t.isIdentifier(node)) {
      const compiled = compileConstIdentifier(node, scope)
      if (compiled || node.name === 'undefined') return compiled
    }

    if (t.isTemplateLiteral(node)) {
      if (node.expressions.length) {
        throw error(node, '[Wombatail] Dynamic template literal className is not supported. Use cn()/clsx() with explicit class strings.')
      }
      return compileClassString(node.quasis.map((q) => q.value.cooked || '').join(''), node)
    }

    if (t.isLogicalExpression(node, { operator: '&&' })) {
      const right = compile(node.right, scope)
      if (!right) return null
      return t.logicalExpression('&&', node.left, right)
    }

    if (t.isConditionalExpression(node)) {
      const consequent = compile(node.consequent, scope) || t.nullLiteral()
      const alternate = compile(node.alternate, scope) || t.nullLiteral()
      return t.conditionalExpression(node.test, consequent, alternate)
    }

    if (t.isArrayExpression(node)) {
      return combine(node.elements.map((item) => item && compile(item, scope)))
    }

    if (t.isObjectExpression(node)) return compileObjectExpression(node, scope)

    if (isMergeFunction(node, t, options)) {
      return combine(node.arguments.map((arg) => {
        if (t.isSpreadElement(arg)) {
          throw error(arg, '[Wombatail] Spread arguments inside cn()/clsx() are not supported.')
        }
        return compile(arg, scope)
      }))
    }

    throw error(
      node,
      '[Wombatail] className must be statically analyzable. Supported: string/const literals, cn()/clsx(), &&, ternary, arrays, and clsx object form.',
    )
  }

  return { compile, compileClassString, combine }
}

module.exports = { createExpressionCompiler, unwrapStaticExpression }
