/*
 * Based on code used in graphql-request repo, responsible for building
 * GET request based GraphQL query requests
 *
 * https://github.com/prisma-labs/graphql-request/blob/d7d0a8d0a176bd6e2cd22831aff174416389be39/src/index.ts#L70
 */

/**
 * Clean a GraphQL document to send it via a GET query
 *
 * @param {string} str GraphQL query
 * @returns {string} Cleaned query
 */
const queryCleaner = (str: string): string => str.replace(/([\s,]|#[^\n\r]+)+/g, ' ').trim();

type TBuildGetQueryParams<V> =
  | {
      query: string;
      variables: V | undefined;
      operationName: string | undefined;
    }
  | {
      query: string[];
      variables: V[] | undefined;
      operationName: undefined;
    };

/**
 * Create query string for GraphQL request
 *
 * @param {object} param0 -
 *
 * @param {string|string[]} param0.query the GraphQL document or array of document if it's a batch request
 * @param {string|undefined} param0.operationName the GraphQL operation name
 * @param {any|any[]} param0.variables the GraphQL variables to use
 */
export const buildGetQueryParams = <V>({ query, variables, operationName }: TBuildGetQueryParams<V>): string => {
  if (!Array.isArray(query)) {
    const search: string[] = [`query=${encodeURIComponent(queryCleaner(query))}`];

    if (variables) {
      search.push(`variables=${encodeURIComponent(JSON.stringify(variables))}`);
    }

    if (operationName) {
      search.push(`operationName=${encodeURIComponent(operationName)}`);
    }

    return search.join('&');
  }

  if (typeof variables !== 'undefined' && !Array.isArray(variables)) {
    throw new Error('Cannot create query with given variable type, array expected');
  }

  // Batch support
  const payload = query.reduce<{ query: string; variables: string | undefined }[]>((accu, currentQuery, index) => {
    accu.push({
      query: queryCleaner(currentQuery),
      variables: variables ? JSON.stringify(variables[index]) : undefined,
    });
    return accu;
  }, []);

  return `query=${encodeURIComponent(JSON.stringify(payload))}`;
};
