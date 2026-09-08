const { createBabelPlugins } = require('babel-plugin-wombatail/babel-config')

module.exports = function (api) {
  api.cache(true)

  return {
    presets: ['babel-preset-expo'],
    // Breakpoints and theme color tokens are read from wombatail.config.ts.
    plugins: createBabelPlugins({ unistyles: { root: 'src' } }),
  }
}
