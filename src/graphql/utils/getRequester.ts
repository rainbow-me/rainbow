import { rainbowFetch, RainbowFetchRequestOpts } from '@/rainbow-fetch';
import { DocumentNode } from 'graphql';

const allowedOperations = ['mutation', 'query'];

type Options = Pick<RainbowFetchRequestOpts, 'timeout' | 'headers'>;

export function getRequester(url: string) {
  return async function requester<
    TResponse = unknown,
    TVariables = Record<string, unknown>
  >(
    node: DocumentNode,
    variables?: TVariables,
    options?: Options
  ): Promise<TResponse> {
    const definitions = node.definitions.filter(
      d =>
        d.kind === 'OperationDefinition' &&
        allowedOperations.includes(d.operation)
    );

    // Valid document should contain *single* query or mutation unless it's has a fragment
    if (definitions.length !== 1) {
      throw new Error('Node must contain a single query or mutation');
    }

    const { data } = await rainbowFetch(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify({
        query: node.loc?.source.body,
        variables,
      }),
    });

    return data.data;
  };
}
