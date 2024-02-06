import React, { Profiler, useCallback, useRef } from 'react';

const events = new Map<string, number>();

/**
 * Records timestamp of the beginning of the event
 * @param name {string} - Name of the event (flow/function name)
 */
export function measureEventStart(name: string) {
  events.set(name, global.performance.now());
}

/**
 * Records timestamp of the ending of the event. Logs the time between
 * calls of the beginning and the ending.
 * @param name {string} - Name of the event (flow/function name)
 */
export function measureEventEnd(name: string) {
  const total = global.performance.now() - events.get(name)!;
  events.set(name, total);
  global.console.log(`Event ${name}: ${total.toFixed(2)}ms\n`);
}

const timeoutRegistry = new Map<string, any>();

function createDebounceAverage(title: string, phase: string, delay = 100) {
  let values: number[] = [];
  let timeout: NodeJS.Timeout;

  return (value: number) => {
    clearTimeout(timeout);
    values.push(value);

    timeout = setTimeout(() => {
      const total = values.reduce((acc, curr) => acc + curr);
      const max = Math.max(...values).toFixed(2);
      const min = Math.min(...values).toFixed(2);
      // it won't log it for some reason when i don't String() it
      const count = String(values.length);
      const average = String((total / values.length).toFixed(2));

      global.console.log(`${phase}: ${title} (${count}) - ${average}ms (max: ${max}ms; min: ${min}ms)`);

      values = [];
    }, delay);
  };
}

function createOrResolveDebounce(id: string, phase: string, delay?: number) {
  const key = phase + id;
  if (!timeoutRegistry.has(key)) {
    timeoutRegistry.set(key, createDebounceAverage(id, phase, delay));
  }

  return timeoutRegistry.get(key);
}

/**
 * Measures each and average execution time of the functions (hook) with provided debounce.
 * Logs the result with name, count of events and its average, for example:
 * exec: useDimensions - 1.4ms
 * average: useDimensions (24) - 2ms (max: 2.4ms; min 1.9ms)
 *
 * Examples:
 * // hook needs to be measured
 * export default function useDimensions() {
 *   const { height, scale, width } = useWindowDimensions();
 *   return { height, width, scale };
 * }
 *
 * // it can be wrapped directly at place of definition
 * export default measureAverage('useDimensions')(function useDimensions() {
 *   const { height, scale, width } = useWindowDimensions();
 *   return { height, width, scale };
 * });
 *
 * // or at the place of execution
 * function WalletScreen(props) {
 *   // .. code
 *   const { height } = measureAverage('useDimensions @ WalletScreen')(useDimensions)()
 * }
 *
 * @param name {string} - Name of the function/hook to be used in the log
 * @param every {boolean = false} - should log every execution
 * @param delay {number = 100} - debounce delay
 * @returns a function, then pass function that need to be tracked as an argument
 * that second function will return a wrapped function that will behave as the original function.
 */
export function measureAverage(name: string, every = false, delay = 100) {
  const onExec = createOrResolveDebounce(name, 'average', delay);

  return (fn: (...args: any[]) => any) => {
    return function (this: any, ...args: any[]) {
      const start = global.performance.now();
      const result = fn.apply(this, args);

      const time = global.performance.now() - start;

      onExec(time);

      if (every) {
        global.console.log(`exec: ${name} - ${time.toFixed(2)}ms`);
      }

      return result;
    };
  };
}

/**
 * **IMPORTANT**
 * Don't forget to use profiling version of RN
 * More: https://www.notion.so/rainbowdotme/Profiling-React-Native-application-66388365e9d7490d955d06ddd04906fb#6ee9955663524c2fa1c19750956accc7
 *
 * React can record mount and update events of specific components.
 * We can log that data. In order to do so, we can use `RenderProfiler`
 * util that uses `Profiler` component from the`react` package and wraps
 * specific part of the application with it.
 * In order to identify specific renders we need to provide `name`
 * and what events to track: `update` or `mount`.
 * By default it’s gonna log only debounced average result with specified `delay`.
 * But it can also log every event when we combine `every` prop with `mount` or `update`
 *
 * Can wrap any component at any level, can be nested.
 *
 * Example usage:
 * <RenderProfiler name="BalanceCoinRow" update mount every>
 *   <BalanceCoinRow />
 * </RenderProfiler>
 *
 * @param props - what to track and how often.
 * @returns - react component
 */
export function RenderProfiler({
  children,
  name,
  delay,
  mount,
  update,
  every,
}: React.PropsWithChildren<{
  name: string;
  delay?: number;
  mount?: boolean;
  update?: boolean;
  every?: boolean;
}>) {
  const onMount = useRef<null | any>(null);

  if (!onMount.current) {
    onMount.current = createOrResolveDebounce(name, 'mount', delay);
  }

  const onUpdate = useRef<null | any>(null);

  if (!onUpdate.current) {
    onUpdate.current = createOrResolveDebounce(name, 'update', delay);
  }

  const onRender = useCallback(
    (id: string, phase: string, actualDuration: number) => {
      if (phase === 'mount' && mount) {
        onMount.current(actualDuration);

        if (every) {
          global.console.log(`${id} mount: ${actualDuration.toFixed(2)}ms`);
        }
      }

      if (phase === 'update' && update) {
        onUpdate.current(actualDuration);

        if (every) {
          global.console.log(`${id} update: ${actualDuration.toFixed(2)}ms`);
        }
      }
    },
    [mount, update, onUpdate, onMount, every]
  );

  return (
    <Profiler id={name} onRender={onRender}>
      {children}
    </Profiler>
  );
}
