import { SharedValue, executeOnUIRuntimeSync, runOnUI, useSharedValue } from 'react-native-reanimated';
import { useRunOnce } from '@/hooks/useRunOnce';

type Initializer<T> = () => T;
type PrepareFunction<P> = () => P;
type PreparedInitializer<T, P> = (prepared: P) => T;

type UseWorkletClassArgs<P, T> =
  | [initializeWorklet: Initializer<T>, lazyInit?: boolean]
  | [prepareOnJS: PrepareFunction<P>, initializeWorklet: PreparedInitializer<T, P>, lazyInit?: boolean];

// -- Overload 1: A worklet function that returns a worklet class instance
export function useWorkletClass<T>(initializeWorklet: Initializer<T>, lazyInit?: boolean): SharedValue<T | undefined>;

// -- Overload 2: Prepare a value on the JS runtime, then pass it to the worklet class initializer
export function useWorkletClass<P, T>(
  prepareOnJS: PrepareFunction<P>,
  initializeWorklet: PreparedInitializer<T, P>,
  lazyInit?: boolean
): SharedValue<T | undefined>;

export function useWorkletClass<P, T>(...args: UseWorkletClassArgs<P, T>): SharedValue<T | undefined> {
  const workletClass = useSharedValue<T | undefined>(undefined);

  useRunOnce(() => {
    if (args.length === 1) {
      const initializeWorklet = args[0];
      executeOnUIRuntimeSync(() => {
        workletClass.value = initializeWorklet();
      })();
    } else if (typeof args[1] === 'function') {
      const [prepareOnJS, initializeWorklet, lazyInit] = args;
      const prepared = prepareOnJS();

      if (lazyInit) {
        runOnUI(() => {
          workletClass.value = initializeWorklet(prepared);
        })();
      } else {
        executeOnUIRuntimeSync(() => {
          workletClass.value = initializeWorklet(prepared);
        })();
      }
    } else {
      const [initializeWorklet, lazyInit] = args;

      if (lazyInit) {
        runOnUI(() => {
          workletClass.value = initializeWorklet();
        })();
      } else {
        executeOnUIRuntimeSync(() => {
          workletClass.value = initializeWorklet();
        })();
      }
    }
  });

  return workletClass;
}
