'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const { createBabelPlugins } = require('../src/babel-config')

test('Babel config helper locks Wombatail before Unistyles', () => {
  const plugins = createBabelPlugins({ unistyles: { root: 'src' }, after: ['react-native-worklets/plugin'] })
  assert.equal(plugins[0][0], require.resolve('../src/index.js'))
  assert.equal(plugins[1][0], 'react-native-unistyles/plugin')
  assert.equal(plugins[2], 'react-native-worklets/plugin')
})

test('Babel config helper requires Unistyles root', () => {
  assert.throws(() => createBabelPlugins({ unistyles: {} }), /unistyles.root/)
})
