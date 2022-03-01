import { UseQueryOptions } from 'react-query';

type PromiseValue<PromiseType> = PromiseType extends PromiseLike<infer Value>
  ? PromiseValue<Value>
  : PromiseType;

type ExtractFnReturnType<FnType extends (...args: any) => any> = PromiseValue<
  ReturnType<FnType>
>;

export type UseQueryData<
  QueryFnType extends (...args: any) => any
> = ExtractFnReturnType<QueryFnType>;

export type QueryConfig<QueryFnType extends (...args: any) => any> = Omit<
  UseQueryOptions<ExtractFnReturnType<QueryFnType>>,
  'queryKey' | 'queryFn'
>;
