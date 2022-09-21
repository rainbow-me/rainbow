import {
  QueryFunctionContext,
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';

// Used to obtain argument types for query functions.
export type QueryFunctionArgs<
  T extends (...args: any) => any
> = QueryFunctionContext<ReturnType<T>>;

// Used to obtain types for query function results.
export type QueryFunctionResult<
  FnType extends (...args: any) => any
> = PromiseValue<ReturnType<FnType>>;

// Note: we probably want to restrict the amount of configuration
// to the React Query hook. So we are picking out the only the
// configuration the consumer needs. I think these options are
// reasonable.
export type QueryConfig<TData, TError, TQueryKey extends QueryKey> = Pick<
  UseQueryOptions<TData, TError, TData, TQueryKey>,
  | 'cacheTime'
  | 'enabled'
  | 'refetchInterval'
  | 'retry'
  | 'staleTime'
  | 'select'
  | 'onError'
  | 'onSettled'
  | 'onSuccess'
>;

export type MutationConfig<Data, Error, Variables = void> = Pick<
  UseMutationOptions<Data, Error, Variables>,
  'onError' | 'onMutate' | 'onSettled' | 'onSuccess'
>;

// Used to obtain types for mutation function results.
export type MutationFunctionResult<
  FnType extends (...args: any) => any
> = PromiseValue<ReturnType<FnType>>;

// //////////////////////////////////////////////////////////////////////////////////////
// Deprecated Types

type PromiseValue<PromiseType> = PromiseType extends PromiseLike<infer Value>
  ? PromiseValue<Value>
  : PromiseType;

type ExtractFnReturnType<FnType extends (...args: any) => any> = PromiseValue<
  ReturnType<FnType>
>;

export type UseQueryData<
  QueryFnType extends (...args: any) => any
> = ExtractFnReturnType<QueryFnType>;

export type QueryConfigDeprecated<
  QueryFnType extends (...args: any) => any
> = Omit<
  UseQueryOptions<ExtractFnReturnType<QueryFnType>>,
  'queryKey' | 'queryFn'
>;
