/**
 * @jest-environment node
 */

import { deepEqual } from '@/worklets/comparisons';
import { createDerivedStore } from '../../createDerivedStore';
import { createQueryStore } from '../../createQueryStore';
import { createRainbowStore } from '../../createRainbowStore';
import { QueryStatuses } from '../../queryStore/types';
import { SubscribeArgs, SubscribeOverloads } from '../../types';

/**
 * `createDerivedStore` uses `queueMicrotask` to batch updates, so we use
 * this to flush any pending operations before checking for state changes.
 */
async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
}

describe('createDerivedStore', () => {
  // ──────────────────────────────────────────────
  // Basic Usage (Single Dependency)
  // ──────────────────────────────────────────────
  describe('Basic Usage (Single Dependency)', () => {
    it('should only notify watchers after the first subscription derivation and on subsequent updates, allowing getState() one-off derivations when unsubscribed', async () => {
      const baseStore = createRainbowStore(() => ({
        count: 0,
        text: 'init',
      }));

      let deriveCount = 0;
      const useDerived = createDerivedStore($ => {
        deriveCount += 1;
        return $(baseStore).count * 2;
      });

      // Initially no watchers => no derivation
      expect(deriveCount).toBe(0);

      const watcher = jest.fn();
      const unsubscribe = useDerived.subscribe(watcher);
      await flushMicrotasks();

      // First subscription => one derivation => watchers not notified (prevState=undefined)
      expect(deriveCount).toBe(1);
      expect(watcher).toHaveBeenCalledTimes(0);
      expect(useDerived.getState()).toBe(0);

      // Update count => new derived => watchers see old=0 -> new=6
      baseStore.setState({ count: 3 });
      await flushMicrotasks();

      expect(deriveCount).toBe(2);
      expect(useDerived.getState()).toBe(6);
      expect(watcher).toHaveBeenCalledTimes(1);
      expect(watcher).toHaveBeenLastCalledWith(6, 0);

      // Unsubscribe => watchers=0 => future updates won't notify watchers
      unsubscribe();
      baseStore.setState({ count: 10 });
      await flushMicrotasks();

      // No watchers => no immediate derivation
      expect(deriveCount).toBe(2);

      // But calling getState() triggers a one-off derivation => new value
      expect(useDerived.getState()).toBe(20);
      expect(deriveCount).toBe(3);
    });

    it('should skip notifying watchers if derived output is unchanged by Object.is, but still re-derive if the relevant property changed', async () => {
      const baseStore = createRainbowStore(() => ({
        count: 2,
        text: 'hello',
      }));

      let deriveCount = 0;
      const useDerived = createDerivedStore($ => {
        deriveCount += 1;
        const count = $(baseStore).count;
        return count % 2 === 0 ? 'even' : 'odd';
      });

      const watcher = jest.fn();
      const unsubscribe = useDerived.subscribe(watcher);
      await flushMicrotasks();

      // First subscription => watchers=0 calls
      expect(deriveCount).toBe(1);
      expect(watcher).toHaveBeenCalledTimes(0);
      expect(useDerived.getState()).toBe('even');

      // Count: 2 -> 4 => new derived still 'even' => watchers not notified
      baseStore.setState({ count: 4 });
      await flushMicrotasks();

      expect(deriveCount).toBe(2);
      expect(watcher).toHaveBeenCalledTimes(0);

      // 4 -> 5 => becomes 'odd' => watchers see new
      baseStore.setState({ count: 5 });
      await flushMicrotasks();

      expect(deriveCount).toBe(3);
      expect(watcher).toHaveBeenCalledTimes(1);
      expect(useDerived.getState()).toBe('odd');
      expect(watcher).toHaveBeenLastCalledWith('odd', 'even');

      unsubscribe();
    });
  });

  // ──────────────────────────────────────────────
  // Proxy-Based Subscription
  // ──────────────────────────────────────────────
  describe('Proxy-Based Subscription', () => {
    it('should not trigger watchers when reassigning an identical nested value, but should when that nested value actually changes', async () => {
      const baseStore = createRainbowStore(() => ({
        user: {
          name: 'Alice',
          profile: { email: 'alice@example.com' },
        },
        unused: 123,
      }));

      let deriveCount = 0;
      const useDerived = createDerivedStore($ => {
        deriveCount += 1;
        return $(baseStore).user.profile.email;
      });

      const watcher = jest.fn();
      const unsubscribe = useDerived.subscribe(watcher);
      await flushMicrotasks();

      // First derive => watchers=0
      expect(deriveCount).toBe(1);
      expect(watcher).toHaveBeenCalledTimes(0);

      // Replace user object with same final email => watchers skip
      baseStore.setState({
        user: {
          name: 'Alice',
          profile: { email: 'alice@example.com' },
        },
        unused: 999,
      });
      await flushMicrotasks();

      expect(deriveCount).toBe(1);
      expect(watcher).toHaveBeenCalledTimes(0);

      // Now actually change the email => watchers see old -> new
      baseStore.setState({
        user: {
          name: 'Alice',
          profile: { email: 'newalice@example.com' },
        },
        unused: 999,
      });
      await flushMicrotasks();

      expect(deriveCount).toBe(2);
      expect(watcher).toHaveBeenCalledTimes(1);
      expect(watcher).toHaveBeenLastCalledWith('newalice@example.com', 'alice@example.com');

      unsubscribe();
    });

    it('[selectors] should only notify watchers when the directly tracked property changes, ignoring other property or object reference updates', async () => {
      const baseStore = createRainbowStore(() => ({
        data: { key1: 10, key2: 20 },
      }));

      let deriveCount = 0;
      const useDerived = createDerivedStore($ => {
        deriveCount += 1;
        return $(baseStore, s => s.data.key1);
      });

      const watcher = jest.fn();
      const unsubscribe = useDerived.subscribe(watcher);
      await flushMicrotasks();

      // First derive => watchers=0
      expect(deriveCount).toBe(1);
      expect(watcher).toHaveBeenCalledTimes(0);

      // Set data with same key1 => should skip re-derivation
      baseStore.setState({ data: { key1: 10, key2: 999 } });
      await flushMicrotasks();

      expect(deriveCount).toBe(1);
      expect(watcher).toHaveBeenCalledTimes(0);

      // Now actually change key1 => watchers see new
      baseStore.setState({ data: { key1: 11, key2: 999 } });
      await flushMicrotasks();

      expect(deriveCount).toBe(2);
      expect(watcher).toHaveBeenCalledTimes(1);
      expect(watcher).toHaveBeenLastCalledWith(11, 10);

      unsubscribe();
    });
  });

  // ──────────────────────────────────────────────
  // Equality Function (Store-Level)
  // ──────────────────────────────────────────────
  describe('Equality Function (Store-Level)', () => {
    it('should re-derive on the same input but skip watcher notifications if eqFn deems no difference, then notify on real changes', async () => {
      const baseStore = createRainbowStore(() => ({ name: 'Alice', age: 30 }));

      let deriveCount = 0;
      const useDerived = createDerivedStore(
        $ => {
          deriveCount += 1;
          const { name, age } = $(baseStore);
          return { name, age };
        },
        { equalityFn: deepEqual }
      );

      let nameTracker = '';
      let ageTracker = 0;
      let watcherCalls = 0;

      const unsubscribe = useDerived.subscribe(newVal => {
        nameTracker = newVal.name;
        ageTracker = newVal.age;
        watcherCalls += 1;
      });
      await flushMicrotasks();

      // first derive => watchers=0
      expect(deriveCount).toBe(1);
      expect(watcherCalls).toBe(0);

      // set name => watchers see change
      baseStore.setState({ name: 'Bob' });
      await flushMicrotasks();

      expect(deriveCount).toBe(2);
      expect(watcherCalls).toBe(1);
      expect(nameTracker).toBe('Bob');
      expect(ageTracker).toBe(30);

      // set same name again => should not re-derive
      baseStore.setState({ name: 'Bob' });
      await flushMicrotasks();

      expect(deriveCount).toBe(2);
      expect(watcherCalls).toBe(1);

      // now set new age => watchers see new
      baseStore.setState({ age: 31 });
      await flushMicrotasks();

      expect(deriveCount).toBe(3);
      expect(watcherCalls).toBe(2);
      expect(ageTracker).toBe(31);

      unsubscribe();
    });
  });

  // ──────────────────────────────────────────────
  // Rapid Update Batching
  // ──────────────────────────────────────────────
  describe('Rapid Update Batching', () => {
    it('should batch rapid updates', async () => {
      const baseStore = createRainbowStore(() => ({ val: 0 }));
      const secondStore = createRainbowStore(() => ({ val: 0 }));

      let deriveCount = 0;
      let lastValue = 0;
      const useDerived = createDerivedStore($ => {
        deriveCount += 1;
        const value = $(baseStore).val * $(secondStore).val;
        lastValue = value;
        return value;
      });

      const watcher = jest.fn();
      const unsubscribe = useDerived.subscribe(watcher);

      // First derivation => watchers=0
      expect(deriveCount).toBe(1);
      expect(watcher).toHaveBeenCalledTimes(0);
      expect(useDerived.getState()).toBe(0);

      // Update both stores multiple times
      baseStore.setState({ val: 1 });
      secondStore.setState({ val: 2 });
      baseStore.setState({ val: 3 });
      secondStore.setState({ val: 4 });
      await flushMicrotasks();

      // Should have batched updates into a single derivation and called the watcher once
      expect(deriveCount).toBe(2);
      expect(watcher).toHaveBeenCalledTimes(1);
      expect(lastValue).toBe(baseStore.getState().val * secondStore.getState().val);

      unsubscribe();
    });
  });

  // ──────────────────────────────────────────────
  // Synchronous Derivation Chains and Primitives
  // ──────────────────────────────────────────────
  describe('Synchronous Derivation Chains and Primitives', () => {
    it('should derive synchronously when a derived store dependency chain exists, and handle primitive and nullish store states as leaves', async () => {
      const baseStore = createRainbowStore<number | undefined>(() => undefined);
      const secondStore = createRainbowStore(() => 0);

      let totalIntermediaryDerives = 0;

      const baseDerivedStore = createDerivedStore($ => {
        totalIntermediaryDerives += 1;
        return $(baseStore);
      });
      const secondDerivedStore = createDerivedStore($ => {
        totalIntermediaryDerives += 1;
        return $(secondStore);
      });

      let deriveCount = 0;
      let lastValue = 0;
      const useDerived = createDerivedStore($ => {
        deriveCount += 1;
        const value = ($(baseDerivedStore) ?? 0) * ($(secondDerivedStore) ?? 0);
        lastValue = value;
        return value;
      });

      let watcherCalls = 0;
      const unsubscribe = useDerived.subscribe(
        state => state,
        () => (watcherCalls += 1)
      );

      // First derivation => watchers=0
      expect(deriveCount).toBe(1);
      expect(totalIntermediaryDerives / 2).toBe(2);
      expect(watcherCalls).toBe(0);
      expect(useDerived.getState()).toBe(0);

      // Update the derivation chain four times
      baseStore.setState(1);
      secondStore.setState(2);
      baseStore.setState(3);
      secondStore.setState(4);
      await flushMicrotasks();

      // Should have resulted in two useDerivedStore derivations
      expect(deriveCount).toBe(2);

      // And four additional derivations for each pass-through derived store
      expect(totalIntermediaryDerives / 2).toBe(6);

      // But only a single watcher call
      expect(watcherCalls).toBe(1);

      // With the derivation chain in sync
      expect(lastValue).toBe((baseStore.getState() ?? 0) * (secondStore.getState() ?? 0));
      expect(lastValue).toBe((baseDerivedStore.getState() ?? 0) * (secondDerivedStore.getState() ?? 0));

      unsubscribe();
    });
  });

  // ──────────────────────────────────────────────
  // Debounce Option
  // ──────────────────────────────────────────────
  describe('Debounce Option', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    it('should batch multiple updates within a debounce window and notify watchers with the final derived value', async () => {
      const baseStore = createRainbowStore(() => ({ val: 0 }));

      let deriveCount = 0;
      const useDerived = createDerivedStore(
        $ => {
          deriveCount += 1;
          return $(baseStore).val;
        },
        { debounce: 50 }
      );

      const watcher = jest.fn();
      const unsubscribe = useDerived.subscribe(watcher);

      // First derivation => watchers=0
      await flushMicrotasks();
      expect(deriveCount).toBe(1);
      expect(watcher).toHaveBeenCalledTimes(0);

      // Multiple updates quickly
      baseStore.setState({ val: 1 });
      baseStore.setState({ val: 2 });
      baseStore.setState({ val: 3 });
      await flushMicrotasks();

      // No immediate re-derive, still within debounce
      jest.advanceTimersByTime(50);
      await flushMicrotasks();

      // Single final re-derive => watchers=1
      expect(deriveCount).toBe(2);
      expect(watcher).toHaveBeenCalledTimes(1);
      expect(useDerived.getState()).toBe(3);

      unsubscribe();
    });

    it('should flush pending updates immediately when flushUpdates() is called', async () => {
      const baseStore = createRainbowStore(() => ({ val: 10 }));

      let deriveCount = 0;
      let watcherCallCount = 0;
      let lastVal = 0;

      const useDerived = createDerivedStore(
        $ => {
          deriveCount += 1;
          return $(baseStore).val * 2;
        },
        { debounce: 100 }
      );

      const unsubscribe = useDerived.subscribe(val => {
        lastVal = val;
        watcherCallCount += 1;
      });

      // First derivation => watchers=0 calls
      await flushMicrotasks();
      expect(deriveCount).toBe(1);
      expect(watcherCallCount).toBe(0);
      expect(useDerived.getState()).toBe(20);

      // Update, queued by debounce
      baseStore.setState({ val: 15 });
      await flushMicrotasks();
      expect(deriveCount).toBe(1);

      // Flush => immediate re-derive => watchers see new
      useDerived.flushUpdates();
      await flushMicrotasks();

      expect(deriveCount).toBe(2);
      expect(watcherCallCount).toBe(1);
      expect(lastVal).toBe(30);

      unsubscribe();
    });
  });

  // ──────────────────────────────────────────────
  // Stable Subscriptions
  // ──────────────────────────────────────────────
  describe('Stable Subscriptions', () => {
    it('should not rebuild subscriptions on each re-derive', async () => {
      const baseStore = createRainbowStore(() => ({ count: 0 }));

      const secondStore = createRainbowStore<{ nested: { multiplier: number }; inc: () => void }>(set => ({
        nested: { multiplier: 1 },
        inc() {
          set(state => ({ nested: { multiplier: state.nested.multiplier * 10 } }));
        },
      }));

      type BaseState = ReturnType<typeof baseStore.getState>;

      let subscriptionCount = 0;
      const originalSubscribe: SubscribeOverloads<BaseState> = baseStore.subscribe.bind(baseStore);
      baseStore.subscribe = (...args: SubscribeArgs<BaseState>) => {
        subscriptionCount += 1;
        if (args.length === 1) {
          const listener = args[0];
          return originalSubscribe(listener);
        } else {
          const [selector, listener, options] = args;
          return originalSubscribe(selector, listener, options);
        }
      };

      let deriveCount = 0;
      const useDerived = createDerivedStore(
        $ => {
          deriveCount += 1;
          const value = $(baseStore).count * $(secondStore).nested.multiplier;
          return value;
        },
        { stableSubscriptions: true }
      );

      // No watchers => no derivation yet
      expect(deriveCount).toBe(0);

      // Subscribe => trigger first derivation
      const unsubscribe = useDerived.subscribe(() => {
        return;
      });
      await flushMicrotasks();

      expect(subscriptionCount).toBe(1);
      expect(deriveCount).toBe(1);

      // Update a dependency => second derivation
      secondStore.getState().inc();
      await flushMicrotasks();

      // Subscription count should still be 1
      expect(subscriptionCount).toBe(1);
      // Derive count should be 2
      expect(deriveCount).toBe(2);

      unsubscribe();
    });
  });

  // ──────────────────────────────────────────────
  // Subscribe and Unsubscribe Behavior
  // ──────────────────────────────────────────────
  describe('Subscribe and Unsubscribe Behavior', () => {
    it('should not update watchers after destroy, but allow a one-off re-derive if getState() is called post-destroy', async () => {
      const baseStore = createRainbowStore(() => ({ val: 0 }));
      let deriveCount = 0;

      const useDerived = createDerivedStore($ => {
        deriveCount += 1;
        return $(baseStore).val + 1;
      });

      let callCount = 0;
      let lastValue = 0;
      const unsubscribe = useDerived.subscribe(val => {
        lastValue = val;
        callCount += 1;
      });
      await flushMicrotasks();

      // First derivation => watchers=0
      expect(deriveCount).toBe(1);
      expect(callCount).toBe(0);

      // Update base => watchers=1
      baseStore.setState({ val: 10 });
      await flushMicrotasks();

      expect(deriveCount).toBe(2);
      expect(callCount).toBe(1);
      expect(lastValue).toBe(11);

      // destroy => no watchers remain
      useDerived.destroy();
      baseStore.setState({ val: 20 });
      await flushMicrotasks();

      // watchers not called
      expect(callCount).toBe(1);
      expect(deriveCount).toBe(2);

      // But if we do getState => a one-off re-derive => no watchers
      const finalValue = useDerived.getState();
      expect(finalValue).toBe(21);
      expect(deriveCount).toBe(3);

      unsubscribe();
    });

    it('should stop subscription updates after destroy() is called', async () => {
      const baseStore = createRainbowStore(() => ({ val: 0 }));
      let deriveCount = 0;

      const useDerived = createDerivedStore($ => {
        deriveCount += 1;
        return $(baseStore).val + 1;
      });

      let callCount = 0;
      let lastValue = 0;
      const unsubscribe = useDerived.subscribe(val => {
        lastValue = val;
        callCount += 1;
      });
      await flushMicrotasks();

      // First derive => watchers=0
      expect(deriveCount).toBe(1);
      expect(callCount).toBe(0);
      expect(useDerived.getState()).toBe(1);

      // Update => watchers see new
      baseStore.setState({ val: 10 });
      await flushMicrotasks();

      expect(deriveCount).toBe(2);
      expect(callCount).toBe(1);
      expect(lastValue).toBe(11);

      // destroy => watchers unsubscribed
      useDerived.destroy();

      // Another update => no watchers
      baseStore.setState({ val: 20 });
      await flushMicrotasks();

      // If we call getState => a one-off derivation occurs
      expect(useDerived.getState()).toBe(21);
      expect(deriveCount).toBe(3);

      // But watchers remain at 1 call
      expect(callCount).toBe(1);

      unsubscribe();
    });
  });

  // ──────────────────────────────────────────────
  // Subscribe with Slice Listeners
  // ──────────────────────────────────────────────
  describe('Subscribe with Slice Listeners', () => {
    it('should only notify slice listeners for changes in the relevant slice, ignoring the first derivation unless fireImmediately', async () => {
      const baseStore = createRainbowStore(() => ({ foo: 1, bar: 2 }));

      const useDerived = createDerivedStore($ => {
        const { foo, bar } = $(baseStore);
        return {
          sum: foo + bar,
          product: foo * bar,
        };
      });

      let sumCalls = 0;
      let lastSum = 0;
      const unsubSum = useDerived.subscribe(
        s => s.sum,
        newSum => {
          lastSum = newSum;
          sumCalls += 1;
        }
      );
      await flushMicrotasks();

      // No immediate call => watchers=0 for the sum slice
      expect(sumCalls).toBe(0);
      expect(useDerived.getState()).toEqual({ sum: 3, product: 2 });

      let prodCalls = 0;
      let lastProd = 0;
      const unsubProd = useDerived.subscribe(
        s => s.product,
        newProduct => {
          lastProd = newProduct;
          prodCalls += 1;
        },
        { fireImmediately: true }
      );
      // fireImmediately => 1 call with (2,2)
      expect(prodCalls).toBe(1);
      expect(lastProd).toBe(2);

      // Update foo => sum=4 => product=4 => watchers see old -> new
      baseStore.setState({ foo: 2, bar: 2 });
      await flushMicrotasks();

      expect(sumCalls).toBe(1);
      expect(lastSum).toBe(4);
      expect(prodCalls).toBe(2);
      expect(lastProd).toBe(4);

      // Updating foo with the same value => no calls
      baseStore.setState({ foo: 2, bar: 2 });
      await flushMicrotasks();

      expect(sumCalls).toBe(1);
      expect(prodCalls).toBe(2);

      unsubSum();
      unsubProd();
    });
  });

  // ──────────────────────────────────────────────
  // Usage with createQueryStore
  // ──────────────────────────────────────────────
  describe('Usage with createQueryStore', () => {
    it('should derive from the query store and only notify watchers if the final derived output changes', async () => {
      const fetcher = jest.fn(async () => 'some-data');
      const queryStore = createQueryStore<string>({ fetcher });

      let deriveCount = 0;
      const useDerived = createDerivedStore($ => {
        deriveCount += 1;
        const { getData, status } = $(queryStore);
        return { data: getData(), status };
      });

      const watcher = jest.fn();
      const unsubscribe = useDerived.subscribe(watcher);

      // First derive => watchers=0
      expect(deriveCount).toBe(1);
      expect(watcher).toHaveBeenCalledTimes(0);
      expect(useDerived.getState()).toEqual({ status: QueryStatuses.Idle, data: null });

      // Perform a fetch => might transition Idle -> Fetching -> Success => watchers see new final
      await queryStore.getState().fetch();
      expect(deriveCount).toBe(2);
      expect(watcher).not.toHaveBeenCalledTimes(0); // Watchers got at least one call

      const final = useDerived.getState();
      expect(final.status).toBe(QueryStatuses.Success);
      expect(final.data).toBe('some-data');

      // A second fetch with the same data => final derived is unchanged => watchers skip
      const oldWatcherCalls = watcher.mock.calls.length;
      await queryStore.getState().fetch();
      const nextFinal = useDerived.getState();
      expect(nextFinal.data).toBe('some-data');
      expect(watcher.mock.calls.length).toBe(oldWatcherCalls);

      unsubscribe();
    });
  });

  // ──────────────────────────────────────────────
  // setState Should Throw Error
  // ──────────────────────────────────────────────
  describe('setState Should Throw Error', () => {
    it('should throw if setState is called on a derived store', () => {
      const baseStore = createRainbowStore(() => ({ val: 1 }));
      const useDerived = createDerivedStore($ => {
        return $(baseStore).val * 2;
      });

      expect(() => {
        useDerived.setState(0);
      }).toThrow();
    });
  });
});
