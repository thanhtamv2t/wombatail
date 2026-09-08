'use strict'

const { isDescriptor } = require('./values')

function createAstHelpers(t, themeLocal) {
  function propertyKey(name) {
    return t.isValidIdentifier(name) ? t.identifier(name) : t.stringLiteral(name)
  }

  function memberPath(base, path) {
    return path.reduce((node, part) => {
      if (t.isValidIdentifier(part)) return t.memberExpression(node, t.identifier(part))
      return t.memberExpression(node, t.stringLiteral(part), true)
    }, base)
  }

  function descriptorToAst(descriptor) {
    if (!isDescriptor(descriptor)) {
      throw new Error(`Wombatail internal error: invalid style descriptor ${JSON.stringify(descriptor)}`)
    }

    if (descriptor.kind === 'literal') {
      const value = descriptor.value
      if (typeof value === 'number') return t.numericLiteral(value)
      if (typeof value === 'string') return t.stringLiteral(value)
      if (typeof value === 'boolean') return t.booleanLiteral(value)
      if (value === null) return t.nullLiteral()
      throw new Error(`Wombatail internal error: unsupported literal ${String(value)}`)
    }

    if (descriptor.kind === 'theme') return memberPath(themeLocal, descriptor.path)

    if (descriptor.kind === 'breakpoint') {
      return t.objectExpression([
        t.objectProperty(propertyKey(descriptor.name), descriptorToAst(descriptor.value)),
      ])
    }

    throw new Error(`Wombatail internal error: unknown descriptor kind ${descriptor.kind}`)
  }

  function styleObjectToAst(style) {
    return t.objectExpression(
      Object.entries(style).map(([key, descriptor]) =>
        t.objectProperty(propertyKey(key), descriptorToAst(descriptor)),
      ),
    )
  }

  return { descriptorToAst, styleObjectToAst, memberPath }
}

module.exports = { createAstHelpers }
