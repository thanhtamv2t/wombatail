'use strict'

const { StyleSheet } = require('react-native-unistyles')

/**
 * Configure Unistyles from a single wombatail.config file and return the config
 * unchanged so `typeof config` can drive the TypeScript module augmentation.
 * The Babel plugin reads the same file at build time for breakpoints and theme
 * color tokens, so themes/breakpoints must stay inline object literals.
 */
function defineWombatailConfig(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new TypeError('[Wombatail] defineWombatailConfig requires a configuration object.')
  }
  const { themes, breakpoints, ...rest } = config
  if (!themes || typeof themes !== 'object' || !Object.keys(themes).length) {
    throw new TypeError('[Wombatail] defineWombatailConfig requires at least one theme, for example { themes: { light: { colors: {} } } }.')
  }
  if (breakpoints != null && (typeof breakpoints !== 'object' || Array.isArray(breakpoints))) {
    throw new TypeError('[Wombatail] defineWombatailConfig breakpoints must be an object of name -> min width.')
  }

  StyleSheet.configure(breakpoints ? { themes, breakpoints, ...rest } : { themes, ...rest })
  return config
}

module.exports = { defineWombatailConfig }
