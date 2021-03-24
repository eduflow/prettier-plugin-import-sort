'use strict'

function _interopDefault(ex) {
  return ex && typeof ex === 'object' && 'default' in ex ? ex['default'] : ex
}

const { silent: resolve } = _interopDefault(require('resolve-from'))
const { parsers: typescriptParsers } = _interopDefault(
  require('prettier/parser-typescript')
)
const { parsers: javascriptParsers } = _interopDefault(
  require('prettier/parser-babel')
)
const sortImports = _interopDefault(require('import-sort'))
const { getConfig } = _interopDefault(require('import-sort-config'))
const { DEFAULT_CONFIGS } = _interopDefault(require('import-sort-config'))
const path = _interopDefault(require('path'))

const IMPORT_DEFAULT_DEFAULTS_JS =
  DEFAULT_CONFIGS['.js, .jsx, .es6, .es, .mjs, .ts, .tsx']

function throwIf(condition, message) {
  if (condition) {
    throw new Error(`prettier-plugin-import-sort:  ${message}`)
  }
}

function getAndCheckConfig(extension, fileDirectory) {
  const resolvedConfig = getConfig(extension, fileDirectory)
  throwIf(!resolvedConfig, `No configuration found for file type ${extension}`)

  const rawParser = resolvedConfig.config.parser
  const rawStyle = resolvedConfig.config.style

  throwIf(!rawParser, `No parser defined for file type ${extension}`)
  throwIf(!rawStyle, `No style defined for file type ${extension}`)

  const { parser, style } = resolvedConfig

  throwIf(!parser, `Parser "${rawParser}" could not be resolved`)
  throwIf(
    !style || style === rawStyle,
    `Style "${rawStyle}" could not be resolved`
  )

  return resolvedConfig
}

function resolveModule(module, directory) {
  // sortImports() will not accept plain-old options, they do automatic environmental changes
  // with no option for an integration to control to pass in scalar values. We must "resolve" the
  // option value to imitate what getConfig does.
  // From https://github.com/renke/import-sort/blob/master/packages/import-sort-config/src/index.ts
  // since it's not exported
  // also import {silent as resolve} from "resolve-from";

  if (directory) {
    const path = resolve(directory, module)

    if (path) {
      return path
    }
  }

  const defaultPath = resolve(__dirname, module)

  if (defaultPath) {
    return defaultPath
  }

  return undefined
}

function resolveParser(module, directory) {
  return (
    resolveModule(`import-sort-parser-${module}`, directory) ||
    resolveModule(module, directory)
  )
}

function resolveStyle(module, directory) {
  return (
    resolveModule(`import-sort-style-${module}`, directory) ||
    resolveModule(module, directory)
  )
}

function organizeImports(unsortedCode, extension, dirname, options) {
  // First check for Prettier plugin options (initially sent via importSortParser and importSortStyle,
  // then fallback to defaults
  const directory = dirname || path.resolve(__dirname, '..', '..')

  // this throw exceptions up to prettier
  const config = getAndCheckConfig(
    extension,
    directory
  )
  const {
    parser: parserDefault,
    style: styleDefault,
    config: rawConfig
  } = config
  const parser = resolveParser(options.parser, directory) || parserDefault
  const style = resolveStyle(options.style, directory) || styleDefault

  console.log({
    styleDefault,
    style: resolveStyle(options.style, directory),
    // style2: resolveStyle(options.style),
    parserDefault,
    parser: resolveParser(options.parser, directory)
    // parser2: resolveParser(options.parser)
  })

  console.log(require.resolve(`import-sort-style-${options.style}`))

  // parserDefault, config,
  const sortResult = sortImports(
    unsortedCode,
    parser,
    style,
    `dummy${extension}`,
    rawConfig.options
  )
  return sortResult.code
}

const parsers = {
  typescript: {
    ...typescriptParsers.typescript,
    preprocess(text, opts) {
      let extname = '.ts'
      let dirname = null

      if (typeof opts.filepath === 'string') {
        extname = path.extname(opts.filepath)
        dirname = path.dirname(opts.filepath)
      }

      return organizeImports(text, extname, dirname, {
        parser: opts.importSortParser,
        style: opts.importSortStyle
      })
    }
  },
  babel: {
    ...javascriptParsers.babel,
    preprocess(text, opts) {
      let extname = '.js'
      let dirname = null

      if (typeof opts.filepath === 'string') {
        extname = path.extname(opts.filepath)
        dirname = path.dirname(opts.filepath)
      }

      return organizeImports(text, extname, dirname, {
        parser: opts.importSortParser,
        style: opts.importSortStyle
      })
    }
  }
}

const options = {
  importSortParser: {
    type: 'string',
    category: 'import-sort',
    default: IMPORT_DEFAULT_DEFAULTS_JS.parser,
    description:
      'import-sort: parser option (see: https://github.com/renke/import-sort#using-a-different-style-or-parser)'
  },
  importSortStyle: {
    type: 'string',
    category: 'import-sort',
    default: IMPORT_DEFAULT_DEFAULTS_JS.style,
    description:
      'import-sort: style option (see: https://github.com/renke/import-sort#using-a-different-style-or-parser)'
  }
}

module.exports = {
  parsers,
  options
}
