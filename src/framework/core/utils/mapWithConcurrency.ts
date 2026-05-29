/**
 * Maps over `items` with a bounded number of concurrent `mapper` invocations.
 *
 * Results are returned in input order as `PromiseSettledResult`s, so a single
 * rejection never aborts the rest of the batch — callers inspect each entry's
 * `status` to handle fulfilled vs. rejected work individually.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>
): Promise<PromiseSettledResult<R>[]> {
  if (!items.length) return [];

  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;

      try {
        results[index] = {
          status: 'fulfilled',
          value: await mapper(items[index]),
        };
      } catch (reason) {
        results[index] = {
          reason,
          status: 'rejected',
        };
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}
