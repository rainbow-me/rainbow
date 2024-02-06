module.exports = {
  extends: ['../../.eslintrc.js'],
  overrides: [
    {
      files: ['*.graphql'],
      parser: '@graphql-eslint/eslint-plugin',
      plugins: ['@graphql-eslint'],
      rules: {
        '@graphql-eslint/description-style': 'error',
        '@graphql-eslint/naming-convention': [
          'error',
          {
            OperationDefinition: {
              style: 'camelCase',
            },
          },
        ],
        '@graphql-eslint/no-case-insensitive-enum-values-duplicates': 'error',
        '@graphql-eslint/no-hashtag-description': 'error',
        '@graphql-eslint/no-typename-prefix': 'error',
        '@graphql-eslint/require-deprecation-reason': 'error',
        '@graphql-eslint/require-description': ['error', { types: true, DirectiveDefinition: true }],
      },
    },
  ],
};
