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
  env: {
    es2022: true,
    browser: true,
    node: true,
  },

  parser: '@typescript-eslint/parser',

  parserOptions: {
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    project: ['./tsconfig.json'],
  },

  extends: [
    'eslint:recommended',
    'plugin:eslint-comments/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jest/recommended',

    /**
     * For eslint-plugin-import
     *
     * @see https://github.com/import-js/eslint-plugin-import/blob/d45fe21bfa09f61402c68c3d271250d95f9c9ed3/README.md?plain=1#L156
     */
    'plugin:import/recommended',
    'plugin:import/typescript',

    /**
     * Last, must override thing
     */
    'prettier',
  ],

  globals: globalVars,

  settings: {
    'react': {
      version: 'detect',
    },
    'import/resolver': {
      'typescript': true,
      'node': true,
      'babel-module': true,
    },
  },

  rules: {
    // TODO can fix all of these
    'no-var': 'warn',
    'prefer-const': 'warn',
    'prefer-rest-params': 'warn',
    'prefer-spread': 'warn',
    'no-async-promise-executor': 'warn',
    'no-prototype-builtins': 'warn', // this one is probably fine
    'no-irregular-whitespace': 'warn', // not a big deal most of the time

    // Some of these are OK while we transition to TS
    '@typescript-eslint/ban-ts-comment': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-inferrable-types': 'warn',
    '@typescript-eslint/no-empty-function': 'warn',
    // TODO could probably fix this
    '@typescript-eslint/no-var-requires': 'warn',
    // TODO MUST FIX THIS
    '@typescript-eslint/no-non-null-asserted-optional-chain': 'warn',

    'react/prop-types': 'warn', // will be fixed after TS migration
    'react/display-name': 'warn', // TODO easy fix

    // mimic default eslint
    'eslint-comments/disable-enable-pair': ['error', { allowWholeFile: true }],

    /**
     * @see https://typescript-eslint.io/docs/linting/troubleshooting/#eslint-plugin-import
     *
     * From the docs: "We recommend you do not use the following rules, as
     * TypeScript provides the same checks as part of standard type checking:"
     */
    'import/named': 'off',
    'import/namespace': 'off',
    'import/default': 'off',
    'import/no-named-as-default-member': 'off',

    /**
     * From the docs: "The following rules do not have equivalent checks in TypeScript, so we recommend that you only run them at CI/push time, to lessen the local performance burden."
     */
    'import/no-named-as-default': 'off',
    'import/no-cycle': 'off',
    'import/no-unused-modules': 'off',
    'import/no-deprecated': 'off',
  },
};
