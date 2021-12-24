/* eslint-disable sort-keys-fix/sort-keys-fix */
const fs = require('fs');
const path = require('path');
const { parse: babelParse } = require('@babel/parser');
const data = fs.readFileSync(
  path.resolve(__dirname, './globalVariables.js'),
  'utf8'
);
const { parse } = require('ast-parser');

// syntax in globalVariables.js's imports is not supported here
const globalVars = parse(babelParse(data, { sourceType: 'module' }))
  .program.body.find(e => e.nodeType === 'ExportDefaultDeclaration')
  .declaration.properties.map(e => e.key.name)
  .reduce(
    (acc, variable) => {
      acc[variable] = true;
      return acc;
    },
    {
      __DEV__: true,
    }
  );

module.exports = {
  extends: 'rainbow',
  settings: {
    'import/resolver': {
      // eslint wants it to be `'node'` but prettier `node`
      // prettier-ignore
      'node': {
        extensions: [
          '.js',
          '.ios.js',
          '.android.js',
          '.native.js',
          '.ts',
          '.tsx',
        ],
      },
      'babel-module': {
        alias: {},
      },
    },
  },
  plugins: [],
  globals: globalVars,
  rules: {},
  env: { browser: true, node: true },
};
