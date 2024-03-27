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
  extends: ['rainbow'],
  parserOptions: {
    project: ['./tsconfig.json'],
  },
  globals: globalVars,
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
  },
};
