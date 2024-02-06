/**
 * This template follows the patterns described in the Async State RFC:
 * https://www.notion.so/rainbowdotme/Async-State-RFC-711800896f9a458889fc4ffad4de271a
 *
 * How to use this template:
 *
 * Step 1. Find & replace "TemplateResource" with your PascalCase query name (e.g. EnsAvatar)
 * Step 2. Find & replace "templateResource" with your camelCase query name (e.g. ensAvatar)
 * Step 3. Define your query arguments under "// Query Types"
 * Step 4. Define your query key under "// Query Key"
 * Step 5. Define your query function under "// Query Function"
 * Step 6. Define your query hook under "// Query Hook"
 * Step 7. (Optional) Define your query prefetcher under "// Query Prefetcher"
 * Step 8. (Optional) Define your query fetcher under "// Query Fetcher"
 * Step 9. Delete these steps! :D
 */

import { useQuery } from '@tanstack/react-query';

import { createQueryKey, queryClient, QueryConfig, QueryFunctionArgs, QueryFunctionResult } from '@/react-query';

// ///////////////////////////////////////////////
// Query Types

export type TemplateResourceArgs = {
  foo: string;
  bar?: string;
  baz?: number;
};

// ///////////////////////////////////////////////
// Query Key

const templateResourceQueryKey = ({ foo, bar, baz }: TemplateResourceArgs) =>
  createQueryKey('templateResource', { foo, bar, baz }, { persisterVersion: 1 });

type TemplateResourceQueryKey = ReturnType<typeof templateResourceQueryKey>;

// ///////////////////////////////////////////////
// Query Function

async function templateResourceQueryFunction({ queryKey: [{ foo, bar, baz }] }: QueryFunctionArgs<typeof templateResourceQueryKey>) {
  // ...your async stuff here...
  // const result = await doSomething({ foo, bar, baz })
  // return result
}

type TemplateResourceResult = QueryFunctionResult<typeof templateResourceQueryFunction>;

// ///////////////////////////////////////////////
// Query Prefetcher (Optional)

export async function prefetchTemplateResource(
  { foo, bar, baz }: TemplateResourceArgs,
  config: QueryConfig<TemplateResourceResult, Error, TemplateResourceQueryKey> = {}
) {
  return await queryClient.prefetchQuery(templateResourceQueryKey({ foo, bar, baz }), templateResourceQueryFunction, config);
}

// ///////////////////////////////////////////////
// Query Fetcher (Optional)

export async function fetchTemplateResource(
  { foo, bar, baz }: TemplateResourceArgs,
  config: QueryConfig<TemplateResourceResult, Error, TemplateResourceQueryKey> = {}
) {
  return await queryClient.fetchQuery(templateResourceQueryKey({ foo, bar, baz }), templateResourceQueryFunction, config);
}

// ///////////////////////////////////////////////
// Query Hook

export function useTemplateResource(
  { foo, bar, baz }: TemplateResourceArgs,
  config: QueryConfig<TemplateResourceResult, Error, TemplateResourceQueryKey> = {}
) {
  return useQuery(templateResourceQueryKey({ foo, bar, baz }), templateResourceQueryFunction, config);
}
