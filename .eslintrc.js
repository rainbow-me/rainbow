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
  rules: {
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'lodash',
            message:
              'Please avoid using Lodash in favor of using JS methods. If you need it, then add the rule to eslint',
          },
        ],
        patterns: [
          'lodash/*',
          '!lodash/debounce',
          //remove when this methods will be merged
          '!lodash/constant',
          '!lodash/isNil',
          '!lodash/isNumber',
          '!lodash/times',
          '!lodash/capitalize',
          '!lodash/isEmpty',
          '!lodash/toLower',
          '!lodash/findIndex',
          '!lodash/sortBy',
          '!lodash/isString',
          '!lodash/isArray',
          '!lodash/map',
          '!lodash/invert',
          '!lodash/upperFirst',
          '!lodash/partition',
          '!lodash/castArray',
          '!lodash/isNaN',
          '!lodash/lowerCase',
          '!lodash/keys',
          '!lodash/has',
          '!lodash/uniqueId',
          '!lodash/toUpper',
          '!lodash/isUndefined',
          '!lodash/values',
          '!lodash/upperCase',
          '!lodash/mapValues',
          '!lodash/flatten',
          '!lodash/mapKeys',
          '!lodash/startsWith',
          '!lodash/join',
          '!lodash/split',
          '!lodash/concat',
          '!lodash/chunk',
          '!lodash/compact',
          '!lodash/groupBy',
          '!lodash/includes',
          '!lodash/reduce',
          '!lodash/slice',
          '!lodash/flattenDeep',
          '!lodash/property',
          '!lodash/get',
          '!lodash/isFunction',
          '!lodash/findKey',
          '!lodash/isObjectLike',
          '!lodash/omitBy',
          '!lodash/orderBy',
          '!lodash/sumBy',
          '!lodash/take',
          '!lodash/difference',
          '!lodash/differenceWith',
          '!lodash/isEqual',
          '!lodash/uniqBy',
          '!lodash/reverse',
          '!lodash/filter',
          '!lodash/flatMap',
          '!lodash/omit',
          '!lodash/endsWith',
          '!lodash/uniq',
          '!lodash/remove',
          '!lodash/isNull',
          '!lodash/find',
          '!lodash/keyBy',
          '!lodash/pick',
          '!lodash/maxBy',
          '!lodash/minBy',
          '!lodash/without',
          '!lodash/clone',
          '!lodash/replace',
          '!lodash/merge',
          '!lodash/zipObject',
          '!lodash/startCase',
        ],
      },
    ],
  },
  env: { browser: true, node: true },
};
