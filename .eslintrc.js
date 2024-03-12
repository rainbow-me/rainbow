const fs = require('fs');
const path = require('path');
const { parse: babelParse } = require('@babel/parser');
const { parse: astParser } = require('ast-parser');

const filePath = path.resolve(__dirname, './globalVariables.js');
const fileContent = fs.readFileSync(filePath, 'utf8');
const ast = babelParse(fileContent, { sourceType: 'module' });

const exportDeclaration = ast.program.body.find(e => e.nodeType === 'ExportDefaultDeclaration');
const globalVars = exportDeclaration
  ? exportDeclaration.declaration.properties.map(e => e.key.name)
    .reduce((acc, variable) => {
      acc[variable] = true;
      return acc;
    }, { __DEV__: true })
  : {};

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
  },
};

