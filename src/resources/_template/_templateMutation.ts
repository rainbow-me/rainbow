/**
 * This template follows the patterns described in the Async State RFC:
 * https://www.notion.so/rainbowdotme/Async-State-RFC-711800896f9a458889fc4ffad4de271a
 *
 * How to use this template:
 *
 * Step 1. Find & replace "TemplateResource" with your PascalCase query name (e.g. SignMessage)
 * Step 2. Find & replace "templateResource" with your camelCase query name (e.g. signMessage)
 * Step 3. Define your mutation arguments under "// Mutation Types"
 * Step 4. Define your mutation function under "// Mutation Function"
 */

import { useMutation } from '@tanstack/react-query';
import { MutationConfig, MutationFunctionResult } from '@/react-query/types';

// ///////////////////////////////////////////////
// Mutation Types

type TemplateMutationArgs = {
  foo: string;
};

// ///////////////////////////////////////////////
// Mutation Function

async function templateMutationMutationFunction({ foo }: TemplateMutationArgs) {
  // ... your async stuff here ...
  // const result = await doSomething({ foo })
  // return result
}
type TemplateMutationResult = MutationFunctionResult<typeof templateMutationMutationFunction>;

// ///////////////////////////////////////////////
// Mutation Hook

export function useTemplateMutation(mutationConfig: MutationConfig<TemplateMutationResult, Error, TemplateMutationArgs> = {}) {
  return useMutation(['templateMutation'], templateMutationMutationFunction, mutationConfig);
}
