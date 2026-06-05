// eslint-disable-next-line @typescript-eslint/no-var-requires
const { config } = require('./config');

const SCHEMA_AST_CONFIG = {
  plugins: ['schema-ast'],
  config: {
    sort: true,
  },
};

function schemaTarget(url, method) {
  return {
    schema: [{ [url]: { method } }],
    ...SCHEMA_AST_CONFIG,
  };
}

module.exports = {
  generates: {
    './schemas/arc.graphql': schemaTarget(config.arc.schema.url, config.arc.schema.method),
    './schemas/arcDev.graphql': schemaTarget(config.arcDev.schema.url, config.arcDev.schema.method),
    './schemas/ens.graphql': schemaTarget(config.ens.schema.url, config.ens.schema.method),
    './schemas/metadata.graphql': schemaTarget(config.metadata.schema.url, config.metadata.schema.method),
  },
};
