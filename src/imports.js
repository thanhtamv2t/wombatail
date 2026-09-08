'use strict'

function getImportedLocal(programPath, t, source, importedName) {
  for (const statement of programPath.get('body')) {
    if (!statement.isImportDeclaration() || statement.node.source.value !== source) continue
    for (const specifier of statement.node.specifiers) {
      if (t.isImportSpecifier(specifier) && t.isIdentifier(specifier.imported, { name: importedName })) {
        return specifier.local
      }
    }
  }
  return null
}

function addNamedImport(programPath, t, source, importedName, preferredLocal) {
  const existing = getImportedLocal(programPath, t, source, importedName)
  if (existing) return existing

  let local = typeof preferredLocal === 'string' ? t.identifier(preferredLocal) : preferredLocal
  if (!local) local = t.identifier(importedName)
  if (programPath.scope.hasBinding(local.name)) local = programPath.scope.generateUidIdentifier(local.name)

  for (const statement of programPath.get('body')) {
    if (!statement.isImportDeclaration() || statement.node.source.value !== source) continue
    statement.node.specifiers.push(t.importSpecifier(local, t.identifier(importedName)))
    return local
  }

  programPath.unshiftContainer(
    'body',
    t.importDeclaration(
      [t.importSpecifier(local, t.identifier(importedName))],
      t.stringLiteral(source),
    ),
  )
  return local
}

function ensureUnistylesStyleSheet(programPath, t) {
  const existing = getImportedLocal(programPath, t, 'react-native-unistyles', 'StyleSheet')
  if (existing) return existing

  // Never repurpose a React Native StyleSheet import. Existing source code may rely on
  // RN-only helpers/semantics. Generated Wombatail styles always use their own direct
  // react-native-unistyles import so the Unistyles Babel plugin can identify it.
  const preferred = programPath.scope.generateUidIdentifier('wombatailStyleSheet')
  return addNamedImport(programPath, t, 'react-native-unistyles', 'StyleSheet', preferred)
}

function ensurePlatform(programPath, t, preferredLocal) {
  return addNamedImport(programPath, t, 'react-native', 'Platform', preferredLocal)
}

function getReactNativeImportLocals(programPath, t, importedName) {
  const names = new Set()
  for (const statement of programPath.get('body')) {
    if (!statement.isImportDeclaration() || statement.node.source.value !== 'react-native') continue
    for (const specifier of statement.node.specifiers) {
      if (t.isImportSpecifier(specifier) && t.isIdentifier(specifier.imported, { name: importedName })) {
        names.add(specifier.local.name)
      }
    }
  }
  return names
}

module.exports = {
  addNamedImport,
  ensurePlatform,
  ensureUnistylesStyleSheet,
  getImportedLocal,
  getReactNativeImportLocals,
}
