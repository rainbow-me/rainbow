exports.config = {
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
  uniswap: {
    document: './queries/uniswap.graphql',
    schema: {
      method: 'POST',
      url: 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswapv2',
    },
  },
  arc: {
    document: './queries/arc.graphql',
    schema: {
      method: 'GET',
      url: 'https://arc-graphql.rainbow.me/graphql',
    },
  },
};
