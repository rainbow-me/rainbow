// eslint-disable-next-line @typescript-eslint/no-var-requires
const { config } = require('./config');

module.exports = {
  generates: Object.entries(config).reduce((config, [key, value]) => {
    return {
      ...config,
      [`./__generated__/${key}.ts`]: {
        documents: [value.document],
        plugins: ['typescript', 'typescript-operations', 'typescript-generic-sdk'],
        schema: [{ [value.schema.url]: { method: value.schema.method } }],
      },
    };
  }, {}),
};
