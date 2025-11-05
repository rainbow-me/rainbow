import { RefObject, useCallback } from 'react';
import { DerivedValue, runOnUI, useSharedValue } from 'react-native-reanimated';
import { useStableValue } from '@/hooks/useStableValue';
import { hasGetSnapshot } from '@/state/internal/utils/storeUtils';
import { BaseRainbowStore, Selector } from '../types';
import { ListenHandle, useListen, UseListenOptions } from './useListen';

// ============ Types ========================================================== //

export type ListenHandleTuple<Selected> = [ReadOnlySharedValue<Selected>, RefObject<Readonly<ListenHandle>>];

export type ReadOnlySharedValue<T> = DerivedValue<T>;

type UseStoreSharedValueOptions<Selected, ReturnListenHandle extends true | undefined = true | undefined> =
  | (UseListenOptions<Selected> & {
      /**
       * Whether to return a `ListenHandle` that can be used to manually pause or resume the listener.
       *
       * If `true`, the returned value will be a tuple of the shared value and the listen handle.
       * @default false
       */
      returnListenHandle?: ReturnListenHandle;
    })
  | UseListenOptions<Selected>['equalityFn'];

// ============ useStoreSharedValue ================================================== //

/**
 * ### `useStoreSharedValue`
 *
 * Subscribes to a slice of a store and returns a shared value synced to that slice.
 *
 * The shared value is pre-initialized with the selected slice and automatically
 * updates when the selected slice changes according to your `equalityFn`, or `Object.is`
 * by default.
 *
 * ---
 * @param store - Zustand store to track. Should be a stable reference.
 * @param selector - Selects the slice of the store state to track.
 * @param optionsOrEqualityFn - Optional `equalityFn`, `fireImmediately` settings, forwarded to `useListen`.
 *
 * @returns A read-only `SharedValue` that tracks the selected store slice.
 *
 * ---
 * @example
 * ```tsx
 * const chartPrice = useStoreSharedValue(
 *   useCandlestickStore,
 *   state => state.getPrice()
 * );
 *
 * const opacity = useAnimatedStyle(() => ({
 *   opacity: chartPrice.value === undefined ? 0 : 1
 * }));
 *
 * <AnimatedText color="label" size="17pt" style={opacity} weight="heavy">
 *   {chartPrice}
 * </AnimatedText>
 *
 * // To access the listen handle from `useListen`:
 * const [chartPrice, listenHandle] = useStoreSharedValue(
 *   useCandlestickStore,
 *   state => state.getPrice(),
 *   { returnListenHandle: true }
 * );
 * ```
 */
export function useStoreSharedValue<S, Selected>(
  store: BaseRainbowStore<S>,
  selector: Selector<S, Selected>,
  options?: UseStoreSharedValueOptions<Selected, undefined>
): ReadOnlySharedValue<Selected>;

export function useStoreSharedValue<S, Selected>(
  store: BaseRainbowStore<S>,
  selector: Selector<S, Selected>,
  options: UseStoreSharedValueOptions<Selected, true>
): ListenHandleTuple<Selected>;

export function useStoreSharedValue<S, Selected>(
  store: BaseRainbowStore<S>,
  selector: Selector<S, Selected>,
  equalityFn: UseListenOptions<Selected>['equalityFn']
): ReadOnlySharedValue<Selected>;

export function useStoreSharedValue<S, Selected>(
  store: BaseRainbowStore<S>,
  selector: Selector<S, Selected>,
  optionsOrEqualityFn?: UseStoreSharedValueOptions<Selected>
): ReadOnlySharedValue<Selected> | ListenHandleTuple<Selected> {
  const initial = useStableValue(() => buildInitialState(store, selector, optionsOrEqualityFn));
  const sharedValue = useSharedValue<Selected>(initial.selected);

  const listener = useCallback((current: Selected) => runOnUI(() => (sharedValue.value = current))(), [sharedValue]);
  const listenHandle = useListen(store, selector, listener, optionsOrEqualityFn);

  return initial.returnListenHandle ? [sharedValue, listenHandle] : sharedValue;
}

// ============ Utilities ====================================================== //

function buildInitialState<S, Selected>(
  store: BaseRainbowStore<S>,
  selector: Selector<S, Selected>,
  optionsOrEqualityFn: UseStoreSharedValueOptions<Selected>
): {
  returnListenHandle: boolean;
  selected: Selected;
} {
  const hasOptions = optionsOrEqualityFn !== undefined && typeof optionsOrEqualityFn !== 'function';
  const returnListenHandle = (hasOptions && optionsOrEqualityFn?.returnListenHandle) || false;
  return {
    returnListenHandle,
    selected: selector(hasGetSnapshot(store) ? store.getSnapshot() : store.getState()),
  };
}
