
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./swaps.cjs.production.min.js')
} else {
  module.exports = require('./swaps.cjs.development.js')
}
