/**
 * @jest-environment node
 */

import { createQueryStore, getQueryKey, QueryStatuses } from '../../createQueryStore';
import { time } from '@/utils';

// For these tests we use a simple type for the fetched data and query parameters.
type TestData = string;
type TestParams = { id: number };

describe('createQueryStore', () => {
  // ──────────────────────────────────────────────
  // Successful Fetch
  // ──────────────────────────────────────────────
  describe('Successful Fetch', () => {
    it('should fetch data successfully and update store state', async () => {
      const fetcher = jest.fn(async (params: TestParams) => {
        return `data-${params.id}`;
      });
      const store = createQueryStore<TestData, TestParams>({
        fetcher,
        params: { id: 1 },
      });

      // Initially no data and status is Idle.
      expect(store.getState().getData()).toBeNull();
      expect(store.getState().status).toBe(QueryStatuses.Idle);

      const result = await store.getState().fetch({ id: 1 });
      expect(result).toBe('data-1');
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(store.getState().getData({ id: 1 })).toBe('data-1');

      const status = store.getState().getStatus();
      expect(status.isSuccess).toBe(true);
      expect(status.isFetching).toBe(false);
      expect(status.isError).toBe(false);
    });
  });

  // ──────────────────────────────────────────────
  // Error Handling and Retry
  // ──────────────────────────────────────────────
  describe('Error Handling and Retry', () => {
    it('should handle fetch errors and update state with error and retry count', async () => {
      const fetcher = jest.fn(async () => {
        throw new Error('Fetch failed');
      });
      const onError = jest.fn();
      const maxRetries = 2;
      const store = createQueryStore<TestData, TestParams>({
        fetcher,
        maxRetries,
        onError,
        params: { id: 1 },
        staleTime: time.minutes(2),
      });

      // Use fake timers because retries are scheduled via setTimeout.
      jest.useFakeTimers();

      const fetchPromise = store.getState().fetch({ id: 1 });
      // Fast-forward timers so that any scheduled retry happens.
      jest.runAllTimers();
      const result = await fetchPromise;
      expect(result).toBeNull();

      const fetchPromise2 = store.getState().fetch({ id: 1 });
      jest.runAllTimers();
      const result2 = await fetchPromise2;
      expect(result2).toBeNull();

      const fetchPromise3 = store.getState().fetch({ id: 1 });
      jest.runAllTimers();
      const result3 = await fetchPromise3;
      expect(result3).toBeNull();

      // onError should have been called (one or more times)
      expect(onError).toHaveBeenCalled();
      // The store status should be Error.
      expect(store.getState().status).toBe(QueryStatuses.Error);

      // Check that the query cache records a retry count equal to maxRetries.
      const state = store.getState();
      const queryKey = state.queryKey;
      const cacheEntry = state.queryCache[queryKey];
      expect(cacheEntry).toBeDefined();
      expect(cacheEntry?.errorInfo?.retryCount).toBe(maxRetries);
      jest.useRealTimers();
    });
  });

  // ──────────────────────────────────────────────
  // Abort Fetch
  // ──────────────────────────────────────────────
  describe('Abort Fetch', () => {
    it('should abort previous fetch when a new fetch is triggered', async () => {
      // Create a fetcher that never resolves (to simulate a long-running request)
      // but listens to abort events.
      let abortSignal: AbortSignal | null = null;
      const fetcher = jest.fn((params: TestParams, controller: AbortController | null) => {
        abortSignal = controller ? controller.signal : null;
        return new Promise<TestData>((_resolve, reject) => {
          if (abortSignal) {
            abortSignal.addEventListener('abort', () => reject(new Error('[createQueryStore: AbortError] Fetch interrupted')), {
              once: true,
            });
          }
        });
      });

      const store = createQueryStore<TestData, TestParams>({
        fetcher,
        params: { id: 2 },
      });

      // Start the first fetch; it will hang.
      const firstFetchPromise = store.getState().fetch({ id: 1 });
      // Now trigger a second fetch that will force a new fetch call (and abort the previous one).
      // For the second call, override the fetcher so it returns resolved data.
      fetcher.mockImplementationOnce(async (params: TestParams) => {
        return `data-${params.id}`;
      });
      const secondFetchPromise = store.getState().fetch({ id: 2 }, { force: true });

      // The first fetch should return null because it was aborted.
      const firstResult = await firstFetchPromise;
      expect(firstResult).toBeNull();

      const secondResult = await secondFetchPromise;
      expect(secondResult).toBe('data-2');
      // The store data should now reflect the second fetch.
      expect(store.getState().getData({ id: 2 })).toBe('data-2');
    });
  });

  // ──────────────────────────────────────────────
  // Skip Store Updates Option
  // ──────────────────────────────────────────────
  describe('Skip Store Updates Option', () => {
    it('should perform fetch without updating store state when skipStoreUpdates is true', async () => {
      const fetcher = jest.fn(async (params: TestParams) => {
        return `data-${params.id}`;
      });
      const store = createQueryStore<TestData, TestParams>({
        fetcher,
        params: { id: 3 },
      });

      const initialState = store.getState();
      const result = await store.getState().fetch({ id: 3 }, { skipStoreUpdates: true });
      expect(result).toBe('data-3');
      // The internal store state should remain unchanged (no cached data and status remains Idle).
      expect(store.getState().getData({ id: 3 })).toBeNull();
      expect(store.getState().status).toBe(QueryStatuses.Idle);
      expect(store.getState()).toEqual(initialState);
    });
  });

  // ──────────────────────────────────────────────
  // Cache and Staleness
  // ──────────────────────────────────────────────
  describe('Cache and Staleness', () => {
    it('should return cached data when not stale', async () => {
      const fetcher = jest.fn(async (params: TestParams) => {
        return `data-${params.id}`;
      });
      const staleTime = time.minutes(5);
      const store = createQueryStore<TestData, TestParams>({
        fetcher,
        params: { id: 4 },
        staleTime,
      });

      // First fetch
      const result1 = await store.getState().fetch();
      expect(result1).toBe('data-4');
      expect(fetcher).toHaveBeenCalledTimes(1);

      // Immediately call fetch again with the same params.
      // Should return cached data without calling fetcher.
      const result2 = await store.getState().fetch();
      expect(result2).toBe('data-4');
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('should refetch data when stale', async () => {
      jest.useFakeTimers();
      const fetcher = jest.fn(async (params: TestParams) => {
        return `data-${params.id}`;
      });
      const staleTime = time.seconds(1);
      const store = createQueryStore<TestData, TestParams>({
        fetcher,
        params: { id: 5 },
        staleTime,
      });

      // First fetch
      const result1 = await store.getState().fetch();
      expect(result1).toBe('data-5');
      expect(fetcher).toHaveBeenCalledTimes(1);

      // Advance time past the stale threshold.
      jest.advanceTimersByTime(1100);

      // Next fetch should trigger a new fetch because the cached data is stale.
      const result2 = await store.getState().fetch();
      expect(result2).toBe('data-5');
      expect(fetcher).toHaveBeenCalledTimes(2);
      jest.useRealTimers();
    });
  });

  // ──────────────────────────────────────────────
  // Manual Fetch with Force Option
  // ──────────────────────────────────────────────
  describe('Manual Fetch with Force Option', () => {
    it('should override cache when force is true', async () => {
      const fetcher = jest.fn(async (params: TestParams) => {
        return `data-${params.id}-${Math.random()}`;
      });
      const store = createQueryStore<TestData, TestParams>({
        fetcher,
        params: { id: 6 },
      });

      const result1 = await store.getState().fetch({ id: 6 });
      expect(result1).toMatch(/^data-6-/);
      expect(fetcher).toHaveBeenCalledTimes(1);

      // Force a fetch even though data is already cached.
      const result2 = await store.getState().fetch({ id: 6 }, { force: true });
      expect(result2).toMatch(/^data-6-/);
      expect(fetcher).toHaveBeenCalledTimes(2);

      // The store’s cached data should now be updated.
      expect(store.getState().getData({ id: 6 })).toBe(result2);
    });
  });

  // ──────────────────────────────────────────────
  // Reset Functionality and Param-Less Query Keys
  // ──────────────────────────────────────────────
  describe('Reset Functionality and Param-Less Query Keys', () => {
    it('should reset store state to initial values', async () => {
      const fetcher = jest.fn(async (params?: { id?: number }) => {
        return `data-${params?.id ?? 0}`;
      });
      const store = createQueryStore<TestData, { id?: number }>({
        fetcher,
        params: {},
      });

      // Manually fetch with no params.
      await store.getState().fetch();
      expect(store.getState().getData()).toBe('data-0');
      expect(store.getState().status).toBe(QueryStatuses.Success);
      expect(store.getState().queryKey).toBe('[]');

      // Now fetch with a param.
      await store.getState().fetch({ id: 7 });
      expect(store.getState().getData({ id: 7 })).toBe('data-7');
      expect(store.getState().status).toBe(QueryStatuses.Success);
      expect(store.getState().queryKey).toBe('[7]');

      // Call reset and verify that state is cleared.
      store.getState().reset();
      expect(store.getState().getData({ id: 7 })).toBeNull();
      expect(store.getState().status).toBe(QueryStatuses.Idle);

      // The queryKey should be reset based on the config ('[]' if no params).
      expect(store.getState().queryKey).toBe('[]');
    });
  });

  // ──────────────────────────────────────────────
  // onFetched Callback
  // ──────────────────────────────────────────────
  describe('onFetched Callback', () => {
    it('should call onFetched callback on successful fetch', async () => {
      const fetcher = jest.fn(async (params: TestParams) => {
        return `data-${params.id}`;
      });
      const onFetched = jest.fn();
      const store = createQueryStore<TestData, TestParams>({
        fetcher,
        onFetched,
        params: { id: 8 },
      });

      const result = await store.getState().fetch({ id: 8 });
      expect(result).toBe('data-8');
      expect(onFetched).toHaveBeenCalled();
      // Verify that the callback receives the expected properties.
      const callbackArg = onFetched.mock.calls[0][0];
      expect(callbackArg.data).toBe('data-8');
      expect(typeof callbackArg.fetch).toBe('function');
      expect(callbackArg.params).toEqual({ id: 8 });
      expect(typeof callbackArg.set).toBe('function');
    });
  });

  // ──────────────────────────────────────────────
  // setData Option
  // ──────────────────────────────────────────────
  describe('setData Option', () => {
    it('should use custom setData callback to update store state', async () => {
      // Here we define a custom store state type that includes a custom field.
      type CustomState = { customData: TestData | null };
      const fetcher = jest.fn(async (params: TestParams) => {
        return `data-${params.id}`;
      });
      const store = createQueryStore<TestData, TestParams, CustomState>(
        {
          fetcher,
          setData: ({ data, set }) => {
            set({ customData: data });
          },
          cacheTime: time.days(1),
          params: { id: 9 },
          staleTime: time.minutes(20),
        },
        // Custom state creator to add a custom field.
        () => ({
          customData: null,
        })
      );

      const result = await store.getState().fetch({ id: 9 });
      expect(result).toBe('data-9');
      // The custom state field should be updated by the setData callback.
      expect(store.getState().customData).toBe('data-9');
      // Since setData was used, the internal queryCache data should be null.
      const state = store.getState();
      const cacheEntry = state.queryCache[state.queryKey];
      expect(cacheEntry?.data).toBeNull();
      // The lastFetchedAt timestamp however should be defined.
      expect(cacheEntry?.lastFetchedAt).toBeTruthy();
    });
  });

  // ──────────────────────────────────────────────
  // Simultaneous Fetch Deduplication
  // ──────────────────────────────────────────────
  describe('Fetch Deduplication', () => {
    it('should return the same data object for concurrent fetch calls with same params', async () => {
      let resolveFn: (value: { data: string }) => void = () => {
        return;
      };
      const fetcher = jest.fn(async () => {
        return new Promise<{ data: string }>(resolve => {
          resolveFn = resolve;
        });
      });
      const store = createQueryStore<{ data: string }, TestParams>({
        fetcher,
        params: { id: 10 },
      });

      const promise1 = store.getState().fetch({ id: 10 });
      await Promise.resolve(); // allow state update to propagate
      const promise2 = store.getState().fetch({ id: 10 });
      await Promise.resolve();

      // Resolve the underlying promise with an object
      const responseData = { data: 'data-10' };
      resolveFn(responseData);

      // Both promises should resolve to the same object reference
      const result1 = await promise1;
      const result2 = await promise2;
      expect(result1).toBe(result2);
      expect(result1).toBe(responseData);
      expect(fetcher).toHaveBeenCalledTimes(1);
    });
  });

  // ──────────────────────────────────────────────
  // Automatic Refetch Scheduling
  // ──────────────────────────────────────────────
  describe('Automatic Refetch Scheduling', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });
    it('should schedule a refetch when data becomes stale', async () => {
      const fetcher = jest.fn(async (params: TestParams) => {
        return `data-${params.id}`;
      });
      const staleTime = time.seconds(1);
      const store = createQueryStore<TestData, TestParams>({
        fetcher,
        params: { id: 11 },
        staleTime,
      });

      await store.getState().fetch({ id: 11 });
      expect(fetcher).toHaveBeenCalledTimes(1);

      // Simulate a subscription so that the store’s auto-refetch logic is active.
      const unsubscribe = store.subscribe(() => {
        return;
      });
      // Advance timers past the stale threshold.
      jest.advanceTimersByTime(1100);
      // Allow any scheduled promise resolution.
      await Promise.resolve();
      expect(fetcher).toHaveBeenCalledTimes(2);
      unsubscribe();
    });
  });

  // ──────────────────────────────────────────────
  // Parameter Change (Static Params)
  // ──────────────────────────────────────────────
  describe('Parameter Change', () => {
    it('should update queryKey when parameters change', async () => {
      const fetcher = jest.fn(async (params: TestParams) => {
        return `data-${params.id}`;
      });
      const store = createQueryStore<TestData, TestParams>({
        fetcher,
        params: { id: 12 },
      });

      // First fetch with id=12.
      await store.getState().fetch({ id: 12 });
      const initialQueryKey = store.getState().queryKey;
      expect(initialQueryKey).toBe(getQueryKey({ id: 12 }));

      // Fetch with a different parameter.
      await store.getState().fetch({ id: 13 });
      const newQueryKey = store.getState().queryKey;
      expect(newQueryKey).toBe(getQueryKey({ id: 13 }));
      expect(newQueryKey).not.toBe(initialQueryKey);
    });
  });

  describe('Fetch Triggers and Abort Behavior', () => {
    // ──────────────────────────────────────────────
    // Manual Abort via Reset
    // ──────────────────────────────────────────────
    it('should manually abort an ongoing fetch when reset is called', async () => {
      let abortSignal: AbortSignal | null = null;
      // Create a fetcher that never resolves (simulating a long‐running request)
      // and listens for an abort event.
      const fetcher = jest.fn((params: TestParams, controller: AbortController | null) => {
        abortSignal = controller ? controller.signal : null;
        return new Promise<TestData>((_resolve, reject) => {
          if (abortSignal) {
            abortSignal.addEventListener('abort', () => reject(new Error('[createQueryStore: AbortError] Fetch interrupted')), {
              once: true,
            });
          }
        });
      });

      const store = createQueryStore<TestData, TestParams>({ fetcher, params: { id: 14 } });
      const fetchPromise = store.getState().fetch({ id: 14 });
      // Manually call reset to abort any active fetch.
      store.getState().reset();
      const result = await fetchPromise;
      expect(result).toBeNull();
    });

    // ──────────────────────────────────────────────
    // Enabled Toggling
    // ──────────────────────────────────────────────
    it('should trigger a fetch when enabled toggles from false to true', async () => {
      const fetcher = jest.fn(async (params: TestParams) => {
        return `data-${params.id}`;
      });
      // Start with the store disabled.
      const store = createQueryStore<TestData, TestParams>({
        fetcher,
        enabled: false,
        params: { id: 15 },
      });

      // Simulate a subscription so that the store’s auto-refetch logic is active.
      const unsubscribe = store.subscribe(() => {
        return;
      });

      // Explicitly set enabled to false.
      store.setState({ enabled: false });
      // Now toggle enabled to true.
      store.setState({ enabled: true });
      // Allow the subscription/side‐effect to process.
      await Promise.resolve();
      // Expect that a fetch was automatically triggered.
      expect(fetcher).toHaveBeenCalledTimes(1);
      unsubscribe();
    });

    // ──────────────────────────────────────────────
    // Auto–Refetch Cancellation on Unsubscribe
    // ──────────────────────────────────────────────
    it('should cancel scheduled refetch when all subscriptions are removed', async () => {
      jest.useFakeTimers();
      const fetcher = jest.fn(async (params: TestParams) => {
        return `data-${params.id}`;
      });
      // Set a very short staleTime so that a refetch is scheduled.
      const staleTime = time.seconds(0.2);
      const store = createQueryStore<TestData, TestParams>({
        fetcher,
        params: { id: 16 },
        staleTime,
      });

      // Create a subscription to activate auto–refetch behavior.
      const unsubscribe = store.subscribe(() => {
        return;
      });

      expect(fetcher).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(time.seconds(0.25));

      expect(fetcher).toHaveBeenCalledTimes(2);

      // Now remove all subscriptions.
      unsubscribe();
      // Advance timers past the staleTime.
      await jest.advanceTimersByTimeAsync(time.seconds(0.5));
      // Allow any scheduled promise to resolve.
      await Promise.resolve();
      // Since there are no subscribers, the scheduled refetch should not occur.
      expect(fetcher).toHaveBeenCalledTimes(2);
      jest.useRealTimers();
    });
  });

  // ──────────────────────────────────────────────
  // getQueryKey Utility
  // ──────────────────────────────────────────────
  describe('getQueryKey Utility', () => {
    it('should return a sorted JSON string representation of parameters', () => {
      const params = { b: 2, a: 1 };
      const key = getQueryKey(params);
      // Since getQueryKey sorts keys and then returns the JSON string of the values,
      // the expected output is the JSON string for the array [1,2].
      expect(key).toBe(JSON.stringify([1, 2]));
    });
  });
});
