import { GRAPH_ENS_API_KEY } from 'react-native-dotenv';

exports.config = {
  ens: {
    __name: 'ens',
    document: './queries/ens.graphql',
    schema: {
      method: 'POST',
      url: `https://gateway-arbitrum.network.thegraph.com/api/${GRAPH_ENS_API_KEY}/subgraphs/id/5XqPmWe6gjyrJtFn9cLy237i4cWw2j9HcUJEXsP5qGtH`,
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
