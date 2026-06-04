import { mapWithConcurrency } from './mapWithConcurrency';

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// Drains the microtask queue so parked workers can pick up the next item before we assert.
const flush = () =>
  new Promise<void>(resolve => {
    setImmediate(resolve);
  });

describe('mapWithConcurrency', () => {
  it('returns [] for empty input without invoking the mapper', async () => {
    const mapper = jest.fn(async (n: number) => n);
    const results = await mapWithConcurrency([], 4, mapper);
    expect(results).toEqual([]);
    expect(mapper).not.toHaveBeenCalled();
  });

  it('preserves input order even when items resolve out of order', async () => {
    const deferreds = [0, 1, 2, 3].map(() => createDeferred<number>());
    const promise = mapWithConcurrency([0, 1, 2, 3], 4, (n: number) => deferreds[n].promise);

    deferreds[3].resolve(30);
    deferreds[2].resolve(20);
    deferreds[1].resolve(10);
    deferreds[0].resolve(0);

    const results = await promise;
    expect(results.map(r => (r.status === 'fulfilled' ? r.value : null))).toEqual([0, 10, 20, 30]);
  });

  it('captures rejections without aborting the rest of the batch', async () => {
    const boom = new Error('boom');
    const results = await mapWithConcurrency([0, 1, 2], 3, async (n: number) => {
      if (n === 1) throw boom;
      return n;
    });

    expect(results[0]).toEqual({ status: 'fulfilled', value: 0 });
    expect(results[1]).toEqual({ status: 'rejected', reason: boom });
    expect(results[2]).toEqual({ status: 'fulfilled', value: 2 });
  });

  it('mirrors the Polymarket team-metadata fetch: a dozen events at concurrency 4', async () => {
    const items = Array.from({ length: 12 }, (_, i) => i);
    const deferreds = items.map(() => createDeferred<number>());
    let inFlight = 0;
    let maxInFlight = 0;

    const promise = mapWithConcurrency(items, 4, async (i: number) => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await deferreds[i].promise;
      inFlight -= 1;
      return i * 2;
    });

    for (let i = 0; i < items.length; i++) {
      await flush();
      expect(inFlight).toBeLessThanOrEqual(4);
      deferreds[i].resolve(i);
    }

    const results = await promise;
    expect(results).toHaveLength(12);
    expect(maxInFlight).toBe(4);
    expect(results.map(r => (r.status === 'fulfilled' ? r.value : null))).toEqual(items.map(i => i * 2));
  });

  it('never exceeds the concurrency cap and actually reaches it', async () => {
    const total = 6;
    const concurrency = 2;
    const deferreds = Array.from({ length: total }, () => createDeferred<number>());
    let inFlight = 0;
    let maxInFlight = 0;

    const promise = mapWithConcurrency(
      Array.from({ length: total }, (_, i) => i),
      concurrency,
      async (i: number) => {
        inFlight += 1;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await deferreds[i].promise;
        inFlight -= 1;
        return i;
      }
    );

    for (let i = 0; i < total; i++) {
      await flush();
      expect(inFlight).toBeLessThanOrEqual(concurrency);
      deferreds[i].resolve(i);
    }

    await promise;
    expect(maxInFlight).toBe(concurrency);
  });

  it('clamps concurrency greater than items.length to items.length', async () => {
    const total = 3;
    const deferreds = Array.from({ length: total }, () => createDeferred<number>());
    let inFlight = 0;
    let maxInFlight = 0;

    const promise = mapWithConcurrency(
      Array.from({ length: total }, (_, i) => i),
      10,
      async (i: number) => {
        inFlight += 1;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await deferreds[i].promise;
        inFlight -= 1;
        return i;
      }
    );

    await flush();
    deferreds.forEach((d, i) => d.resolve(i));
    const results = await promise;

    expect(results).toHaveLength(total);
    expect(maxInFlight).toBe(total);
  });

  it.each([0, -3, NaN])('clamps invalid concurrency (%p) to a single serial worker', async concurrency => {
    const total = 3;
    let inFlight = 0;
    let maxInFlight = 0;
    const mapper = jest.fn(async (i: number) => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await Promise.resolve();
      inFlight -= 1;
      return i;
    });

    const results = await mapWithConcurrency(
      Array.from({ length: total }, (_, i) => i),
      concurrency,
      mapper
    );

    expect(mapper).toHaveBeenCalledTimes(total);
    expect(maxInFlight).toBe(1);
    expect(results.map(r => (r.status === 'fulfilled' ? r.value : null))).toEqual([0, 1, 2]);
  });
});
