'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const { ensureUnistylesStyleSheet } = require('../src/imports')

function fakeTypes() {
  return {
    isImportSpecifier(node) { return node && node.type === 'ImportSpecifier' },
    isIdentifier(node, match) {
      return !!node && node.type === 'Identifier' && (!match || node.name === match.name)
    },
    identifier(name) { return { type: 'Identifier', name } },
    stringLiteral(value) { return { type: 'StringLiteral', value } },
    importSpecifier(local, imported) { return { type: 'ImportSpecifier', local, imported } },
    importDeclaration(specifiers, source) { return { type: 'ImportDeclaration', specifiers, source } },
  }
}

function importPath(node) {
  return {
    node,
    isImportDeclaration() { return node.type === 'ImportDeclaration' },
  }
}

test('generated Unistyles import never hijacks an existing RN StyleSheet binding', () => {
  const t = fakeTypes()
  const rnStyleSheet = t.importSpecifier(t.identifier('StyleSheet'), t.identifier('StyleSheet'))
  const rnImport = t.importDeclaration([rnStyleSheet], t.stringLiteral('react-native'))
  const body = [importPath(rnImport)]
  const inserted = []

  const programPath = {
    get(name) {
      assert.equal(name, 'body')
      return body
    },
    scope: {
      hasBinding() { return false },
      generateUidIdentifier() { return t.identifier('_wombatailStyleSheet') },
    },
    unshiftContainer(name, node) {
      assert.equal(name, 'body')
      inserted.unshift(node)
      body.unshift(importPath(node))
    },
  }

  const local = ensureUnistylesStyleSheet(programPath, t)

  assert.equal(local.name, '_wombatailStyleSheet')
  assert.equal(rnImport.specifiers.length, 1)
  assert.equal(rnImport.specifiers[0].local.name, 'StyleSheet')
  assert.equal(inserted.length, 1)
  assert.equal(inserted[0].source.value, 'react-native-unistyles')
  assert.equal(inserted[0].specifiers[0].imported.name, 'StyleSheet')
})
