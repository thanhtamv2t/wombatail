import type wombatailBabelPlugin = require('./index')

export interface WombatailBabelConfigOptions {
  wombatail?: wombatailBabelPlugin.PluginOptions
  unistyles: {
    root: string
    autoProcessImports?: string[]
    autoProcessPaths?: string[]
    autoRemapImports?: unknown[]
    debug?: boolean
    [key: string]: unknown
  }
  after?: unknown[]
}

export function createBabelPlugins(options: WombatailBabelConfigOptions): unknown[]
