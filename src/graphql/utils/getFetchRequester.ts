import { rainbowFetch, RainbowFetchRequestOpts } from '@/rainbow-fetch';
import { DocumentNode } from 'graphql';
import { resolveRequestDocument } from 'graphql-request';
import { buildGetQueryParams } from '@/graphql/utils/buildGetQueryParams';
import { ARC_GRAPHQL_API_KEY, METADATA_GRAPHQL_API_KEY } from 'react-native-dotenv';

const allowedOperations = ['mutation', 'query'];

type Options = Pick<RainbowFetchRequestOpts, 'timeout' | 'headers'>;

type Config = {
  __name: string;
  schema: {
    url: string;
    method?: string;
  };
};

/**
 * Additional request options passed to the `fetch`er function.
 *
 * These are keyed by the `__name` prop on the config object. The config object
 * is shared with the graphql codegen CLI, hence the strange naming to avoid
 * conflicts.
 *
 * This stuff can't go in `config.js` because that file is loaded by the
 * codegen CLI AND our application. So it needs to be runnable in both
 * environments.
 */
const additionalConfig: {
  [__name: string]: RainbowFetchRequestOpts;
} = {
  arc: {
    headers: {
      'x-api-key': ARC_GRAPHQL_API_KEY,
    },
  },
  arcDev: {
    headers: {
      'x-api-key': ARC_GRAPHQL_API_KEY,
    },
  },
  metadata: {
    headers: {
      Authorization: `Bearer ${METADATA_GRAPHQL_API_KEY}`,
    },
  },
  metadataPOST: {
    headers: {
      Authorization: `Bearer ${METADATA_GRAPHQL_API_KEY}`,
    },
  },
};

export function getFetchRequester(config: Config) {
  const { url, method = 'POST' } = config.schema;

  return async function requester<TResponse = unknown, TVariables = Record<string, unknown>>(
    node: DocumentNode,
    variables?: TVariables,
    options?: Options
  ): Promise<TResponse> {
    const definitions = node.definitions.filter(
      definition => definition.kind === 'OperationDefinition' && allowedOperations.includes(definition.operation)
    );

    if (definitions.length !== 1) {
      throw new Error('Node must contain a single query or mutation');
    }

    const { query, operationName } = resolveRequestDocument(node);
    let requestUrl: string = url;
    const requestOptions: RainbowFetchRequestOpts = {
      ...options,
      headers: {
        ...(additionalConfig[config.__name]?.headers || {}),
        ...(options?.headers || {}),
      },
      method,
    };
    if (method === 'GET') {
      const queryStringExtension = buildGetQueryParams({
        query,
        operationName,
        variables,
      });
      requestUrl = `${url}?${queryStringExtension}`;
    } else {
      requestOptions.body = JSON.stringify({
        query,
        variables,
        operationName,
      });
    }
    const { data } = await rainbowFetch<{ data: TResponse }>(requestUrl, requestOptions);

    return data.data;
  };
}
