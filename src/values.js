'use strict'

function literal(value) {
  return { kind: 'literal', value }
}

function theme(path) {
  return { kind: 'theme', path }
}

function breakpoint(name, value) {
  return { kind: 'breakpoint', name, value }
}

function isDescriptor(value) {
  return Boolean(value && typeof value === 'object' && typeof value.kind === 'string')
}

function toCamelCase(value) {
  return value.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())
}

module.exports = { literal, theme, breakpoint, isDescriptor, toCamelCase }
