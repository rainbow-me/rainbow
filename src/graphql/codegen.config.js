// eslint-disable-next-line @typescript-eslint/no-var-requires
const { config } = require('./config');

const SERVICE_SCHEMAS = {
  arc: './schemas/arc.graphql',
  arcDev: './schemas/arcDev.graphql',
  ens: './schemas/ens.graphql',
  metadata: './schemas/metadata.graphql',
  metadataPOST: './schemas/metadata.graphql',
};

module.exports = {
  generates: Object.entries(config).reduce((generatedConfig, [key, value]) => {
    const schema = SERVICE_SCHEMAS[key];
    if (!schema) {
      throw new Error(`Missing GraphQL schema for "${key}". Run yarn graphql-introspect.`);
    }

    return {
      ...generatedConfig,
      [`./__generated__/${key}.ts`]: {
        documents: [value.document],
        plugins: ['typescript', 'typescript-operations', 'typescript-generic-sdk'],
        schema,
      },
    };
  }, {}),
};
