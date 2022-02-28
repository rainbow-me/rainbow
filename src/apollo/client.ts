import {
  ApolloClient,
  ApolloQueryResult,
  HttpLink,
  InMemoryCache,
  QueryOptions,
} from '@apollo/client';
import { OperationVariables } from '@apollo/client/core/types';

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
  ...defaultOptions,
  cache: new InMemoryCache(),
  link: new HttpLink({
    uri: 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswapv2',
  }),
});

export const blockClient = new ApolloClient({
  ...defaultOptions,
  cache: new InMemoryCache(),
  link: new HttpLink({
    uri: 'https://api.thegraph.com/subgraphs/name/blocklytics/ethereum-blocks',
  }),
});

export const ensClient = new ApolloClient({
  ...defaultOptions,
  cache: new InMemoryCache(),
  link: new HttpLink({
    uri: 'https://api.thegraph.com/subgraphs/name/ensdomains/ens',
  }),
});

export class ApolloClientWithTimeout extends ApolloClient<any> {
  queryWithTimeout<T = any, TVariables = OperationVariables>(
    options: QueryOptions<TVariables, T>,
    timeout: number
  ): Promise<ApolloQueryResult<T>> {
    return new Promise((resolve, reject) => {
      const abortController = new AbortController();
      const apolloQuery = this.query({
        ...options,
        context: {
          fetchOptions: {
            signal: abortController.signal,
          },
        },
      });
      const id = setTimeout(() => {
        abortController.abort();
        reject();
      }, timeout);
      return apolloQuery.then(
        result => {
          clearTimeout(id);
          resolve(result);
        },
        err => {
          clearTimeout(id);
          reject(err);
        }
      );
    });
  }
}

export const metadataClient = new ApolloClientWithTimeout({
  ...defaultOptions,
  cache: new InMemoryCache(),
  link: new HttpLink({
    uri: 'http://localhost:8080/v1/graph',
    useGETForQueries: true,
  }),
});
