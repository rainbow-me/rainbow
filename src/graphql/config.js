exports.config = {
  ens: {
    schema: {
      url: 'https://api.thegraph.com/subgraphs/name/ensdomains/ens',
      method: 'POST',
    },
    file: './queries/ens.graphql',
  },
  metadata: {
    schema: { url: 'https://metadata.p.rainbow.me/v1/graph', method: 'GET' },
    file: './queries/metadata.graphql',
  },
};
