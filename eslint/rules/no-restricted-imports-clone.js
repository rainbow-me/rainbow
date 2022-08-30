const eslint = require('eslint');
module.exports = new eslint.Linter().getRules().get('no-restricted-imports');
