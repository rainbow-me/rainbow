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

/**
 * @deprecated Use the `@/graphql` module for new GraphQL queries.
 * @link https://github.com/rainbow-me/rainbow/blob/develop/src/graphql/README.md
 * */
export const compoundClientDeprecated = new ApolloClient({
  cache: new InMemoryCache(),
  link: new HttpLink({
    uri: 'https://api.thegraph.com/subgraphs/name/graphprotocol/compound-v2',
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
    uri: 'https://metadata.p.rainbow.me/v1/graph',
    useGETForQueries: true,
  }),
});
