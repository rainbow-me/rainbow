const { schemas } = require('./schemas');

module.exports = {
  generates: Object.entries(schemas).reduce((config, [key, value]) => {
    return {
      ...config,
      [`./__generated__/${key}.ts`]: {
        schema: [{ [value.url]: { method: value.method || 'POST' } }],
        documents: value.files,
        plugins: [
          'typescript',
          'typescript-operations',
          'typescript-generic-sdk',
        ],
      },
    };
  }, {}),
};
