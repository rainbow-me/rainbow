exports.schemas = {
  ens: {
    url: 'https://api.thegraph.com/subgraphs/name/ensdomains/ens',
    files: ['./queries/ens.graphql'],
  },
  metadata: {
    url: 'https://metadata.p.rainbow.me/v1/graph',
    files: ['./queries/metadata.graphql'],
    method: 'GET',
  },
};
