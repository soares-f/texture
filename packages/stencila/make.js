/* globals __dirname, process */
const b = require('substance-bundler')
const path = require('path')
const fs = require('fs')
const { merge } = require('substance')

// Constants
// ---------

const COMMON_SETTINGS = (custom) => {
  return merge({
  // paramaters that are passed to the rollup-commonjs-plugin
    commonjs: {
      namedExports: { 'acorn/dist/walk.js': [ 'simple', 'base' ] }
    }
  }, custom)
}

const BROWSER_EXTERNALS = {
  'substance': 'window.substance',
  'substance-texture': 'window.texture',
  'stencila-mini': 'window.stencilaMini',
  'stencila-libcore': 'window.stencilaLibcore',
  'plotly.js': 'window.Plotly'
}

const NODEJS_EXTERNALS = [
  'substance',
  'substance-texture',
  'stencila-mini',
  'stencila-libcore',
  'plotly.js'
]

const DIST = './dist/'

b.task('clean', () => {
  b.rm(DIST)
  b.rm('tmp')
})

b.task('css', () => {
  b.css('styles/_index.css', DIST + 'stencila.css', {
    variables: true
  })
})

b.task('build', () => {
  b.js('index.es.js', COMMON_SETTINGS({
    dest: DIST + 'stencila.js',
    format: 'umd',
    moduleName: 'stencila',
    globals: BROWSER_EXTERNALS,
    external: NODEJS_EXTERNALS
  }))
})

b.task('prism', () => {
  // Note: we stitch together a version that contains only what we need
  // and exposing it as an es6 module
  b.custom('Bundling prism...', {
    src: [
      'node_modules/prismjs/components/prism-core.js',
      'node_modules/prismjs/components/prism-clike.js',
      'node_modules/prismjs/components/prism-r.js',
      'node_modules/prismjs/components/prism-python.js',
      'node_modules/prismjs/components/prism-sql.js',
      'node_modules/prismjs/components/prism-javascript.js'
    ],
    dest: 'tmp/prism.js',
    execute (files) {
      let chunks = ['const _self = {}']
      files.forEach((file) => {
        let basename = path.basename(file)
        let content = fs.readFileSync(file, 'utf8')
        chunks.push(`/** START ${basename} **/`)
        if (basename === 'prism-core.js') {
          // cut out the core
          let start = content.indexOf('var Prism = (function(){')
          let end = content.lastIndexOf('})();') + 5
          content = content.substring(start, end)
        }
        chunks.push(content)
        chunks.push(`/** END ${basename} **/`)
      })
      chunks.push('export default Prism')
      b.writeFileSync('tmp/prism.js', chunks.join('\n'))
    }
  })
})
