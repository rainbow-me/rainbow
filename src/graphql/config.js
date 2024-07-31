exports.config = {
  ens: {
    __name: 'ens',
    document: './queries/ens.graphql',
    schema: {
      method: 'POST',
      url: 'https://gateway-arbitrum.network.thegraph.com/api/35a75cae48aab2b771d1e53543a37a0f/subgraphs/id/5XqPmWe6gjyrJtFn9cLy237i4cWw2j9HcUJEXsP5qGtH',
    },
  },
  metadata: {
    __name: 'metadata',
    document: './queries/metadata.graphql',
    schema: { method: 'GET', url: 'https://metadata.p.rainbow.me/v1/graph' },
  },
  metadataPOST: {
    __name: 'metadataPOST',
    document: './queries/metadata.graphql',
    schema: { method: 'POST', url: 'https://metadata.p.rainbow.me/v1/graph' },
  },
  arc: {
    __name: 'arc',
    document: './queries/arc.graphql',
    schema: {
      method: 'GET',
      url: 'https://arc-graphql.rainbow.me/graphql',
      headers: {
        'x-api-key': 'ARC_GRAPHQL_API_KEY',
      },
    },
  },
  arcDev: {
    __name: 'arcDev',
    document: './queries/arc.graphql',
    schema: {
      method: 'GET',
      url: 'https://arc-graphql.rainbowdotme.workers.dev/graphql',
      headers: {},
    },
  },
};
