'use strict'

function flattenStylePair(t, compiled, existing) {
  const elements = []
  if (t.isArrayExpression(compiled)) elements.push(...compiled.elements.filter(Boolean))
  else if (compiled) elements.push(compiled)
  if (t.isArrayExpression(existing)) elements.push(...existing.elements.filter(Boolean))
  else if (existing) elements.push(existing)
  return t.arrayExpression(elements)
}

function mergeWithStyleCallback(t, scope, compiled, existing) {
  const stateId = scope.generateUidIdentifier('wombatailPressState')
  const call = t.callExpression(existing, [stateId])
  return t.arrowFunctionExpression([stateId], flattenStylePair(t, compiled, call))
}

function mergePressableUnknownStyle(t, scope, compiled, existing) {
  // Pressable accepts either StyleProp<ViewStyle> or (state) => StyleProp<ViewStyle>.
  // Capture the original expression exactly once at render time, preserving evaluation
  // timing/side effects, then return the callback Pressable expects.
  const capturedId = scope.generateUidIdentifier('wombatailExistingStyle')
  const stateId = scope.generateUidIdentifier('wombatailPressState')
  const resolvedExisting = t.conditionalExpression(
    t.binaryExpression('===', t.unaryExpression('typeof', capturedId, true), t.stringLiteral('function')),
    t.callExpression(capturedId, [stateId]),
    capturedId,
  )
  const callback = t.arrowFunctionExpression(
    [stateId],
    flattenStylePair(t, compiled, resolvedExisting),
  )
  const captureFactory = t.arrowFunctionExpression([capturedId], callback)
  return t.callExpression(captureFactory, [existing])
}

module.exports = { flattenStylePair, mergeWithStyleCallback, mergePressableUnknownStyle }
