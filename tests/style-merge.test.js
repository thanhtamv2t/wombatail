'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const { mergePressableUnknownStyle } = require('../src/style-merge')

function fakeTypes() {
  return {
    isArrayExpression(node) { return node?.type === 'ArrayExpression' },
    arrayExpression(elements) { return { type: 'ArrayExpression', elements } },
    arrowFunctionExpression(params, body) { return { type: 'ArrowFunctionExpression', params, body } },
    callExpression(callee, args) { return { type: 'CallExpression', callee, arguments: args } },
    conditionalExpression(testNode, consequent, alternate) { return { type: 'ConditionalExpression', test: testNode, consequent, alternate } },
    binaryExpression(operator, left, right) { return { type: 'BinaryExpression', operator, left, right } },
    unaryExpression(operator, argument) { return { type: 'UnaryExpression', operator, argument } },
    stringLiteral(value) { return { type: 'StringLiteral', value } },
  }
}

function countIdentity(node, target, seen = new Set()) {
  if (!node || typeof node !== 'object') return 0
  if (node === target) return 1
  if (seen.has(node)) return 0
  seen.add(node)
  let n = 0
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) for (const item of value) n += countIdentity(item, target, seen)
    else n += countIdentity(value, target, seen)
  }
  return n
}

test('ambiguous Pressable style expression is captured exactly once at render time', () => {
  const t = fakeTypes()
  let uid = 0
  const scope = { generateUidIdentifier(name) { return { type: 'Identifier', name: `_${name}${uid++}` } } }
  const compiled = { type: 'Identifier', name: 'compiledStyle' }
  const existing = { type: 'CallExpression', callee: { type: 'Identifier', name: 'getStyle' }, arguments: [] }

  const out = mergePressableUnknownStyle(t, scope, compiled, existing)

  assert.equal(out.type, 'CallExpression')
  assert.equal(out.callee.type, 'ArrowFunctionExpression')
  assert.equal(out.arguments.length, 1)
  assert.equal(out.arguments[0], existing)
  assert.equal(countIdentity(out, existing), 1)
  assert.equal(out.callee.body.type, 'ArrowFunctionExpression')
})
