#!/usr/bin/env node
'use strict'

const fs = require('node:fs')
const path = require('node:path')
const { configFileInDir, findConfigFile } = require('../src/config-file')

const CONFIG_TEMPLATE = `import { defineWombatailConfig } from 'babel-plugin-wombatail/runtime'

const config = defineWombatailConfig({
  themes: {
    light: {
      colors: {
        background: '#FFFFFF',
        foreground: '#17171B',
        primary: '#6750A4',
        onPrimary: '#FFFFFF',
        border: '#E4E4E7',
        danger: '#D92D20',
      },
    },
    dark: {
      colors: {
        background: '#101014',
        foreground: '#F7F7F8',
        primary: '#D0BCFF',
        onPrimary: '#2B1748',
        border: '#303038',
        danger: '#FF716A',
      },
    },
  },
  breakpoints: { xs: 0, sm: 360, md: 768, lg: 1024, xl: 1280 },
  settings: { adaptiveThemes: true },
})

export default config
`

const AUGMENTATION = `
type WombatailThemes = (typeof config)['themes']
type WombatailBreakpoints = (typeof config)['breakpoints']

declare module 'react-native-unistyles' {
  export interface UnistylesThemes extends WombatailThemes {}
  export interface UnistylesBreakpoints extends WombatailBreakpoints {}
}
`

function initConfig({ cwd = process.cwd(), js = false } = {}) {
  // Only this directory counts: a config further up the tree belongs to another package.
  const existing = configFileInDir(path.resolve(cwd))
  if (existing) return { created: false, file: existing }
  const file = path.join(cwd, js ? 'wombatail.config.js' : 'wombatail.config.ts')
  fs.writeFileSync(file, js ? CONFIG_TEMPLATE : CONFIG_TEMPLATE + AUGMENTATION, 'utf8')
  return { created: true, file }
}

function parseVersion(value) {
  const match = String(value || '').match(/^(\d+)\.(\d+)\.(\d+)/)
  return match ? match.slice(1).map(Number) : null
}
function gte(a, b) {
  for (let i = 0; i < 3; i += 1) {
    if (a[i] > b[i]) return true
    if (a[i] < b[i]) return false
  }
  return true
}
function readPackageVersion(name) {
  try {
    const file = require.resolve(`${name}/package.json`, { paths: [process.cwd()] })
    return require(file).version
  } catch {
    return null
  }
}
function result(name, ok, detail) { return { name, ok, detail } }

function runDoctor() {
  const checks = []
  const node = parseVersion(process.versions.node)
  checks.push(result('Node.js', Boolean(node && gte(node, [18, 18, 0])), process.versions.node))

  const versions = {
    react: readPackageVersion('react'),
    reactNative: readPackageVersion('react-native'),
    unistyles: readPackageVersion('react-native-unistyles'),
    nitro: readPackageVersion('react-native-nitro-modules'),
    babel: readPackageVersion('@babel/core'),
  }

  const react = parseVersion(versions.react)
  checks.push(result('React >= 19', Boolean(react && react[0] >= 19), versions.react || 'missing'))
  const rn = parseVersion(versions.reactNative)
  checks.push(result('React Native >= 0.78', Boolean(rn && (rn[0] > 0 || rn[1] >= 78)), versions.reactNative || 'missing'))
  const uni = parseVersion(versions.unistyles)
  checks.push(result('Unistyles v3', Boolean(uni && uni[0] === 3), versions.unistyles || 'missing'))
  const babel = parseVersion(versions.babel)
  checks.push(result('Babel 7/8', Boolean(babel && (babel[0] === 7 || babel[0] === 8)), versions.babel || 'missing'))

  let nitroMin = [0, 33, 9]
  if (uni && (uni[0] > 3 || uni[1] >= 2)) nitroMin = [0, 35, 2]
  else if (uni && uni[1] >= 1) nitroMin = [0, 35, 0]
  const nitro = parseVersion(versions.nitro)
  checks.push(result(`Nitro >= ${nitroMin.join('.')}`, Boolean(nitro && gte(nitro, nitroMin)), versions.nitro || 'missing'))

  const configFile = findConfigFile(process.cwd())
  // Informational: a config file is optional when breakpoints/themeColorTokens are passed as plugin options.
  checks.push(result(
    'wombatail.config',
    true,
    configFile ? path.relative(process.cwd(), configFile) : 'none (using Babel plugin options; run "wombatail init" to add one)',
  ))

  return checks
}

const USAGE = `Wombatail CLI

Usage
  npx wombatail init [--js]   Create wombatail.config.ts (or .js) in the current directory
  npx wombatail doctor        Check versions and production requirements
  npx wombatail --help        Show this help

Flags
  --js      init: emit JavaScript instead of TypeScript
  --json    doctor: machine-readable output
`

function runCli(argv) {
  const command = argv.find((arg) => !arg.startsWith('-')) || 'doctor'

  if (argv.includes('--help') || argv.includes('-h') || command === 'help') {
    console.log(USAGE)
    return 0
  }

  if (command === 'init') {
    const { created, file } = initConfig({ js: argv.includes('--js') })
    if (created) {
      console.log(`Created ${path.relative(process.cwd(), file)}`)
      console.log('Next: import it once at the top of your app entry, before any component module.')
      console.log("  import './wombatail.config'")
    } else {
      console.log(`Config already exists: ${path.relative(process.cwd(), file)}`)
    }
    return 0
  }

  if (command !== 'doctor') {
    console.error(`Unknown command: ${command}\n`)
    console.error(USAGE)
    return 1
  }

  const checks = runDoctor()
  if (argv.includes('--json')) {
    console.log(JSON.stringify({ ok: checks.every((x) => x.ok), checks }, null, 2))
  } else {
    console.log('Wombatail production doctor\n')
    for (const check of checks) console.log(`${check.ok ? 'PASS' : 'FAIL'}  ${check.name.padEnd(24)} ${check.detail}`)
    console.log('\nManual requirements: React Native New Architecture enabled; Unistyles Babel plugin root/autoProcessPaths covers every file using Wombatail; Unistyles configuration loads before StyleSheet.create modules; Expo uses a dev/native build (not Expo Go).')
  }
  return checks.every((x) => x.ok) ? 0 : 1
}

if (require.main === module) {
  process.exitCode = runCli(process.argv.slice(2))
}

module.exports = { parseVersion, gte, runDoctor, initConfig, runCli }
