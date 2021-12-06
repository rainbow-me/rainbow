import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';

const defaultOptions = {
  query: {
    errorPolicy: 'all',
    fetchPolicy: 'no-cache',
  },
  watchQuery: {
    errorPolicy: 'ignore',
    fetchPolicy: 'no-cache',
  },
};

export const compoundClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: new HttpLink({
    uri: 'https://api.thegraph.com/subgraphs/name/graphprotocol/compound-v2',
  }),
});

export const uniswapClient = new ApolloClient({
  cache: new InMemoryCache(),
  // @ts-expect-error ts-migrate(2322) FIXME: Type '{ query: { errorPolicy: string; fetchPolicy:... Remove this comment to see the full error message
  defaultOptions,
  link: new HttpLink({
    uri: 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswapv2',
  }),
});

export const blockClient = new ApolloClient({
  cache: new InMemoryCache(),
  // @ts-expect-error ts-migrate(2322) FIXME: Type '{ query: { errorPolicy: string; fetchPolicy:... Remove this comment to see the full error message
  defaultOptions,
  link: new HttpLink({
    uri: 'https://api.thegraph.com/subgraphs/name/blocklytics/ethereum-blocks',
  }),
});

export const ensClient = new ApolloClient({
  cache: new InMemoryCache(),
  // @ts-expect-error ts-migrate(2322) FIXME: Type '{ query: { errorPolicy: string; fetchPolicy:... Remove this comment to see the full error message
  defaultOptions,
  link: new HttpLink({
    uri: 'https://api.thegraph.com/subgraphs/name/ensdomains/ens',
  }),
});
