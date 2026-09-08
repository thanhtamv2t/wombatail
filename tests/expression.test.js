'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const { createExpressionCompiler } = require('../src/expression')
const { normalizeOptions } = require('../src/config')
const { StyleRegistry } = require('../src/registry')

// Tiny Babel-types-shaped adapter to unit-test the expression compiler without installing Babel.
const t = {
  isCallExpression: (n) => n?.type === 'CallExpression',
  isIdentifier: (n, opts) => n?.type === 'Identifier' && (!opts || n.name === opts.name),
  isStringLiteral: (n) => n?.type === 'StringLiteral',
  isNullLiteral: (n) => n?.type === 'NullLiteral',
  isBooleanLiteral: (n) => n?.type === 'BooleanLiteral',
  isTemplateLiteral: (n) => n?.type === 'TemplateLiteral',
  isLogicalExpression: (n, opts) => n?.type === 'LogicalExpression' && (!opts || n.operator === opts.operator),
  isConditionalExpression: (n) => n?.type === 'ConditionalExpression',
  isArrayExpression: (n) => n?.type === 'ArrayExpression',
  isObjectExpression: (n) => n?.type === 'ObjectExpression',
  isObjectProperty: (n) => n?.type === 'ObjectProperty',
  isSpreadElement: (n) => n?.type === 'SpreadElement',
  isParenthesizedExpression: (n) => n?.type === 'ParenthesizedExpression',
  identifier: (name) => ({ type: 'Identifier', name }),
  memberExpression: (object, property) => ({ type: 'MemberExpression', object, property }),
  stringLiteral: (value) => ({ type: 'StringLiteral', value }),
  nullLiteral: () => ({ type: 'NullLiteral' }),
  binaryExpression: (operator, left, right) => ({ type: 'BinaryExpression', operator, left, right }),
  logicalExpression: (operator, left, right) => ({ type: 'LogicalExpression', operator, left, right }),
  conditionalExpression: (testNode, consequent, alternate) => ({ type: 'ConditionalExpression', test: testNode, consequent, alternate }),
  arrayExpression: (elements) => ({ type: 'ArrayExpression', elements }),
}

function s(value) { return { type: 'StringLiteral', value } }
function id(name) { return { type: 'Identifier', name } }
function and(left, right) { return { type: 'LogicalExpression', operator: '&&', left, right } }
function call(name, args) { return { type: 'CallExpression', callee: id(name), arguments: args } }

function setup() {
  const registry = new StyleRegistry()
  const compiler = createExpressionCompiler({
    t,
    options: normalizeOptions(),
    registry,
    stylesLocal: id('_styles'),
    platformLocal: id('Platform'),
    error: (_, message) => new Error(message),
  })
  return { registry, compiler }
}

test('cn() compiles static + conditional classes to style expressions', () => {
  const { registry, compiler } = setup()
  const out = compiler.compile(call('cn', [
    s('p-4 bg-surface'),
    and(id('selected'), s('border border-primary')),
  ]))

  assert.equal(out.type, 'ArrayExpression')
  assert.equal(out.elements.length, 2)
  assert.equal(out.elements[1].type, 'LogicalExpression')
  assert.equal(registry.entries.length, 2)
})

test('platform class emits Platform.OS guard and marks registry', () => {
  const { registry, compiler } = setup()
  const out = compiler.compile(s('ios:mt-4'))
  assert.equal(out.type, 'LogicalExpression')
  assert.equal(out.left.type, 'BinaryExpression')
  assert.equal(out.left.operator, '===')
  assert.equal(registry.platformUsed, true)
})

test('ternary classes stay runtime conditional but class strings disappear', () => {
  const { registry, compiler } = setup()
  const out = compiler.compile({
    type: 'ConditionalExpression',
    test: id('active'),
    consequent: s('opacity-100'),
    alternate: s('opacity-50'),
  })
  assert.equal(out.type, 'ConditionalExpression')
  assert.equal(registry.entries.length, 2)
})

test('clsx object form compiles keys under their conditions', () => {
  const { registry, compiler } = setup()
  const out = compiler.compile(call('clsx', [{
    type: 'ObjectExpression',
    properties: [{
      type: 'ObjectProperty',
      computed: false,
      key: s('bg-primary'),
      value: id('selected'),
    }],
  }]))
  assert.equal(out.type, 'LogicalExpression')
  assert.equal(registry.entries.length, 1)
})

test('unknown runtime class identifier fails by design', () => {
  const { compiler } = setup()
  assert.throws(
    () => compiler.compile(id('propsClassName')),
    /statically analyzable/,
  )
})


test('const class binding is evaluated at compile time', () => {
  const { registry, compiler } = setup()
  const bindingPath = {
    node: { init: s('p-4 bg-primary') },
    scope: null,
    isVariableDeclarator: () => true,
  }
  const scope = {
    uid: 42,
    getBinding(name) {
      return name === 'cardClass' ? { constant: true, path: bindingPath, scope: { uid: 42 } } : null
    },
  }
  bindingPath.scope = scope
  const out = compiler.compile(id('cardClass'), scope)
  assert.equal(out.type, 'MemberExpression')
  assert.equal(registry.entries.length, 1)
})

test('mutable class binding remains rejected', () => {
  const { compiler } = setup()
  const scope = {
    getBinding() {
      return { constant: false, path: { isVariableDeclarator: () => true, node: { init: s('p-4') } } }
    },
  }
  assert.throws(() => compiler.compile(id('dynamicClass'), scope), /statically analyzable/)
})
