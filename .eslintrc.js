/* eslint-disable sort-keys */
const fs = require('fs');
const { parse: babelParse } = require('@babel/parser');
const data = fs.readFileSync('./globalVariables.js', 'utf8');
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
  extends: 'satya164',
  plugins: ['jest'],
  settings: {
    'react': { version: '16' },
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
  globals: globalVars,
  rules: {
    'no-console': 2,
    'sort-imports': [
      'error',
      {
        ignoreCase: true,
        ignoreDeclarationSort: true,
        ignoreMemberSort: false,
        memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
      },
    ],
    'sort-keys': ['error', 'asc', { caseSensitive: false, natural: false }],
    'jest/no-truthy-falsy': 0,
    'react/jsx-sort-props': [
      'error',
      {
        ignoreCase: false,
      },
    ],
    'react-native/no-inline-styles': 0,
    'import/named': 0,
    'import/no-named-as-default': 0,
    'import/order': [
      'error',
      {
        alphabetize: {
          order: 'asc',
          caseInsensitive: false,
        },
        groups: ['builtin', 'external', 'parent', 'sibling', 'index'],
        pathGroups: [
          {
            pattern: '../../../../**',
            group: 'parent',
            position: 'before',
          },
          {
            pattern: '../../../**',
            group: 'parent',
            position: 'before',
          },
          {
            pattern: '../../**',
            group: 'parent',
            position: 'before',
          },
        ],
      },
    ],
    'react/display-name': 2,
    'react/no-array-index-key': 0,
    'jest/no-test-prefixes': 0,
    'jest/no-disabled-tests': 0,
    'babel/no-unused-expressions': 'off',
  },
  env: { browser: true, node: true },
};
