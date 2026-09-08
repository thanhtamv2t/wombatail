'use strict'

const { normalizeOptions } = require('./config')
const { withConfigFile } = require('./config-file')
const { StyleRegistry } = require('./registry')
const { createExpressionCompiler } = require('./expression')
const { createAstHelpers } = require('./ast')
const { flattenStylePair, mergeWithStyleCallback, mergePressableUnknownStyle } = require('./style-merge')
const {
  ensurePlatform,
  ensureUnistylesStyleSheet,
  getImportedLocal,
  getReactNativeImportLocals,
} = require('./imports')

function jsxElementLocalName(node, t) {
  return t.isJSXIdentifier(node.name) ? node.name.name : null
}

module.exports = function wombatailBabelPlugin({ types: t }) {
  return {
    name: 'wombatail-compile-classname',
    visitor: {
      Program(programPath, state) {
        const filename = state.filename || state.file?.opts?.filename || null
        const fromConfigFile = withConfigFile(state.opts || {}, {
          root: state.file?.opts?.root,
          filename,
        })
        // Metro/Babel must recompile when the theme file changes.
        if (fromConfigFile.path && typeof state.addExternalDependency === 'function') {
          state.addExternalDependency(fromConfigFile.path)
        }
        const options = normalizeOptions(fromConfigFile.options)
        const registry = new StyleRegistry()
        const stylesLocal = programPath.scope.generateUidIdentifier('wombatailStyles')
        const themeLocal = programPath.scope.generateUidIdentifier('wombatailTheme')
        const existingPlatform = getImportedLocal(programPath, t, 'react-native', 'Platform')
        const platformLocal = existingPlatform || programPath.scope.generateUidIdentifier('wombatailPlatform')
        const pressableLocals = getReactNativeImportLocals(programPath, t, 'Pressable')

        const error = (nodeOrPath, message) => {
          if (nodeOrPath && typeof nodeOrPath.buildCodeFrameError === 'function') {
            return nodeOrPath.buildCodeFrameError(message)
          }
          const err = new Error(message)
          if (nodeOrPath && nodeOrPath.loc) err.loc = nodeOrPath.loc
          return err
        }

        const expressionCompiler = createExpressionCompiler({
          t,
          options,
          registry,
          stylesLocal,
          platformLocal,
          error,
        })

        function getJsxStyleExpression(attributePath) {
          const value = attributePath.node.value
          if (!value) return null
          return t.isJSXExpressionContainer(value) ? value.expression : null
        }



        programPath.traverse({
          JSXOpeningElement(path) {
            const attrs = path.get('attributes')
            const classAttrs = attrs.filter(
              (attr) => attr.isJSXAttribute() && t.isJSXIdentifier(attr.node.name, { name: 'className' }),
            )
            if (!classAttrs.length) return
            if (classAttrs.length > 1) {
              throw classAttrs[1].buildCodeFrameError('[Wombatail] Duplicate className props are not supported.')
            }
            const classAttr = classAttrs[0]

            if (!options.allowJsxSpread && attrs.some((attr) => attr.isJSXSpreadAttribute())) {
              throw classAttr.buildCodeFrameError(
                '[Wombatail] JSX spread + className is rejected by default because a runtime spread may contain className/style and change precedence. Make props explicit or set allowJsxSpread=true after auditing the component.',
              )
            }

            let compiled = null
            if (t.isStringLiteral(classAttr.node.value)) {
              compiled = expressionCompiler.compileClassString(classAttr.node.value.value, classAttr)
            } else if (t.isJSXExpressionContainer(classAttr.node.value)) {
              compiled = expressionCompiler.compile(classAttr.node.value.expression, classAttr.scope)
            } else if (classAttr.node.value == null) {
              compiled = null
            } else {
              throw classAttr.buildCodeFrameError('[Wombatail] Unsupported className attribute shape.')
            }

            const styleAttr = attrs.find(
              (attr) => attr.isJSXAttribute() && t.isJSXIdentifier(attr.node.name, { name: 'style' }),
            )

            if (!compiled) {
              classAttr.remove()
              return
            }

            if (!styleAttr) {
              classAttr.replaceWith(t.jsxAttribute(t.jsxIdentifier('style'), t.jsxExpressionContainer(compiled)))
              return
            }

            const existing = getJsxStyleExpression(styleAttr)
            if (!existing) {
              throw styleAttr.buildCodeFrameError('[Wombatail] Existing style prop must be a JSX expression, e.g. style={styles.card}.')
            }

            const elementName = jsxElementLocalName(path.node, t)
            const isPressable = elementName && pressableLocals.has(elementName)
            let merged
            if (t.isArrowFunctionExpression(existing) || t.isFunctionExpression(existing)) {
              merged = mergeWithStyleCallback(t, programPath.scope, compiled, existing)
            } else if (isPressable) {
              // Pressable permits both object/array styles and callback styles. Preserve either form safely.
              merged = mergePressableUnknownStyle(t, programPath.scope, compiled, existing)
            } else {
              merged = flattenStylePair(t, compiled, existing)
            }

            classAttr.remove()
            styleAttr.node.value = t.jsxExpressionContainer(merged)
          },
        })

        if (!registry.entries.length) return

        const styleSheetLocal = ensureUnistylesStyleSheet(programPath, t)
        if (registry.platformUsed && !existingPlatform) ensurePlatform(programPath, t, platformLocal)

        const { styleObjectToAst } = createAstHelpers(t, themeLocal)
        const stylesheetObject = t.objectExpression(
          registry.entries.map(({ key, style }) => t.objectProperty(t.identifier(key), styleObjectToAst(style))),
        )
        const createCall = t.callExpression(
          t.memberExpression(styleSheetLocal, t.identifier('create')),
          [t.arrowFunctionExpression([themeLocal], stylesheetObject)],
        )
        const declaration = t.variableDeclaration('const', [t.variableDeclarator(stylesLocal, createCall)])
        declaration.leadingComments = [{ type: 'CommentBlock', value: ' Wombatail generated styles — do not edit. ' }]
        programPath.pushContainer('body', declaration)
        programPath.scope.crawl()

        if (options.debug) {
          const source = fromConfigFile.path ? ` (config: ${fromConfigFile.path})` : ''
          // eslint-disable-next-line no-console
          console.log(`[Wombatail] ${filename || '<unknown>'}: generated ${registry.entries.length} style(s)${source}`) // build-time only
        }
      },
    },
  }
}

module.exports.resolveClassName = require('./resolver').resolveClassName
module.exports.resolveUtility = require('./resolver').resolveUtility
module.exports.normalizeOptions = normalizeOptions
module.exports.withConfigFile = withConfigFile
