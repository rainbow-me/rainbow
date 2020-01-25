import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';

export const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: new HttpLink({
    uri: 'https://api.thegraph.com/subgraphs/name/graphprotocol/compound-v2',
  }),
  uri: 'https://api.thegraph.com/subgraphs/name/graphprotocol/compound-v2',
});
