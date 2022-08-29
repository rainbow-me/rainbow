const config = {
  ens: {
    document: './queries/ens.graphql',
    schema: {
      method: 'POST',
      url: 'https://api.thegraph.com/subgraphs/name/ensdomains/ens',
    },
  },
  metadata: {
    document: './queries/metadata.graphql',
    schema: { method: 'GET', url: 'https://metadata.p.rainbow.me/v1/graph' },
  },
};

exports.config = config;

module.exports = {
  generates: Object.entries(config).reduce(
    (config, [key, { document, schema }]) => {
      return {
        ...config,
        [`./__generated__/${key}.ts`]: {
          documents: [document],
          plugins: [
            'typescript',
            'typescript-operations',
            'typescript-generic-sdk',
          ],
          schema: [{ [schema.url]: { method: schema.method } }],
        },
      };
    },
    {}
  ),
};
