exports.config = {
  ens: {
    __name: 'ens',
    document: './queries/ens.graphql',
    schema: {
      method: 'POST',
      url: 'https://api.thegraph.com/subgraphs/name/ensdomains/ens',
    },
  },
  metadata: {
    __name: 'metadata',
    document: './queries/metadata.graphql',
    schema: { method: 'GET', url: 'https://metadata.p.rainbow.me/v1/graph' },
  },
  arc: {
    __name: 'arc',
    document: './queries/arc.graphql',
    schema: {
      method: 'GET',
      // url: 'https://arc-graphql.rainbow.me/graphql',
      // url: 'https://arc-graphql.rainbowdotme.workers.dev/graphql',
      url: 'http://0.0.0.0:8787/graphql',
      // headers: {
      //   'x-api-key': 'ARC_GRAPHQL_API_KEY',
      // },
    },
  },
  arcDev: {
    __name: 'arcDev',
    document: './queries/arc.graphql',
    schema: {
      method: 'GET',
      url: 'http://0.0.0.0:8787/graphql',
      // url: 'https://arc-graphql.rainbowdotme.workers.dev/graphql',
      headers: {},
    },
  },
};
