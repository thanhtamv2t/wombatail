'use strict'

const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')

const root = path.resolve(__dirname, '..')
const jsFiles = []

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(file)
    else if (entry.isFile() && file.endsWith('.js')) jsFiles.push(file)
  }
}

walk(path.join(root, 'src'))
walk(path.join(root, 'tests'))
walk(path.join(root, 'scripts'))
walk(path.join(root, 'bin'))

for (const file of jsFiles) execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' })
execFileSync(process.execPath, ['--test', path.join(root, 'tests', '*.test.js')], {
  stdio: 'inherit',
  shell: true,
})

console.log(`\nWombatail selftest PASS: ${jsFiles.length} JS files syntax-checked.`)
console.log('Integration note: this sandbox has no React Native/Babel peers or native toolchain, so final Metro/Unistyles/Fabric validation is a consumer-app release gate.')
