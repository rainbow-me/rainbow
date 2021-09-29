
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./rainbow-swaps.cjs.production.min.js')
} else {
  module.exports = require('./rainbow-swaps.cjs.development.js')
}
