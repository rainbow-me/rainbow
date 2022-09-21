export function createQueryKey<TArgs>(
  /** A categorial key for the query. */
  key: string,

  /** Arguments to pass onto the query function.
   * Note: these arguments are also used to generate the query key,
   * meaning that data will be cached against these args.
   */
  args: TArgs,

  /** Configuration for the query key. */
  config: {
    /**
     * A persister version number for the query.
     * If a persisterVersion exists, this means that this query
     * will be stored in AsyncStorage.
     * When a query is stored against a persisterVersion,
     * and is later changed, the cache will bust for this query,
     * and it will be invalidated.
     */
    persisterVersion?: number;
  } = {}
) {
  return [args, key, config] as const;
}
