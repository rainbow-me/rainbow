const fs = require('fs');
const path = require('path');
const { parse: babelParse } = require('@babel/parser');
const data = fs.readFileSync(path.resolve(__dirname, './globalVariables.js'), 'utf8');
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
  root: true,
  extends: ['rainbow', 'plugin:yml/standard'],
  parserOptions: {
    project: ['./tsconfig.json'],
  },
  plugins: ['yml'],
  globals: globalVars,

  overrides: [
    {
      files: ['*.yml', '*.yaml'],
      parser: 'yaml-eslint-parser',
      rules: {
        // currently we use single quotes for yaml files
        'yml/quotes': ['warn', { prefer: 'single', avoidEscape: false }],
        // we also put scalars in quotes
        'yml/plain-scalar': 'off',
      },
    },
  ],
  rules: {
    'no-restricted-imports': [
      'warn',
      {
        patterns: [
          {
            group: ['@react-navigation/core'],
            message: 'You probably want to use @/navigation instead, to ensure that all of our customizations are applied.',
          },
        ],
      },
    ],
    'jest/expect-expect': 'off',
    'jest/no-disabled-tests': 'off',
    'no-nested-ternary': 'off',
    'react/react-in-jsx-scope': 'off',
    'react-hooks/exhaustive-deps': [
      'warn',
      {
        additionalHooks:
          '(useDeepCompareEffect|useDeepCompareCallback|useDeepCompareMemo|useDeepCompareImperativeHandle|useDeepCompareLayoutEffect)',
      },
    ],
  },
};
