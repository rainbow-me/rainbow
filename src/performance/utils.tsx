import React, { Profiler, useCallback, useRef } from 'react';

const events = new Map<string, number>();

export function measureEventStart(name: string) {
  events.set(name, global.performance.now());
}

export function measureEventEnd(name: string) {
  const total = global.performance.now() - events.get(name)!;
  events.set(name, total);
  global.console.log(`Event ${name}: ${total.toFixed(2)}ms\n`);
}

const timeoutRegistry = new Map<string, any>();

function createDebounceAverage(
  title: string,
  phase: string,
  delay: number = 100
) {
  let values: number[] = [];
  let _timeout: NodeJS.Timeout;

  return (value: number) => {
    clearTimeout(_timeout);
    values.push(value);

    _timeout = setTimeout(() => {
      const total = values.reduce((acc, curr) => acc + curr);
      // it won't log it for some reason when i don't String() it
      const len = String(values.length);
      const average = String((total / values.length).toFixed(2));

      global.console.log(`${phase}: ${title} (${len}) ${average}ms`);

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

export function measureAverage(name: string, delay: number = 100) {
  const onExec = createOrResolveDebounce(name, 'exec', delay);

  return (fn: (...args: any[]) => any) => {
    return function (this: any, ...args: any[]) {
      const start = global.performance.now();
      // eslint-disable-next-line babel/no-invalid-this
      const res = fn.apply(this, args);

      onExec(global.performance.now() - start);

      return res;
    };
  };
}

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
    (id, phase, actualDuration) => {
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
