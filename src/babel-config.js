'use strict'

// Referenced by resolved path so the entry never depends on Babel's
// babel-plugin-* name expansion or on the published package name.
const WOMBATAIL_PLUGIN = require.resolve('./index.js')

function createBabelPlugins({ wombatail = {}, unistyles, after = [] } = {}) {
  if (!unistyles || typeof unistyles !== 'object' || typeof unistyles.root !== 'string' || !unistyles.root.trim()) {
    throw new TypeError('[Wombatail] createBabelPlugins requires unistyles.root (for example { root: "src" }).')
  }
  if (!Array.isArray(after)) throw new TypeError('[Wombatail] createBabelPlugins after must be an array of Babel plugin entries.')
  return [
    [WOMBATAIL_PLUGIN, wombatail],
    ['react-native-unistyles/plugin', unistyles],
    ...after,
  ]
}

module.exports = { createBabelPlugins }
