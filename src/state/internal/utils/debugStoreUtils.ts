import { RainbowStateCreator } from '@/state/internal/types';

export function debugStore<CreateState extends RainbowStateCreator<any>>(createState: CreateState): CreateState {
  if (process.env.NODE_ENV === 'development') {
    return ((set, ...rest) => {
      // note: this is a bit off anyway because
      let insideFn = '';

      const wrappedSet = (obj: Record<string, unknown>) => {
        const trace = new Error().stack;

        const cleanTrace = trace
          ?.trim()
          .split('\n')
          .map(line => {
            const [name] = line.trim().match(/at ([^\s]+)/) || [];
            return name?.trim();
          })
          .filter(Boolean)
          .map(x => x.replace('at ', ''))
          .filter(
            x =>
              x &&
              !/^(\?anon_0|_?next|asyncGeneratorStep|tryCallOne|anonymous|apply|_|callReactNative|tryCallTwo|doResolve|Promise|flushedQueue|invokeCallbackAndReturnFlushedQueue|invokeGuardedCallback|executeDispatch)/.test(
                x
              )
          )
          .slice(1, 10)
          .join(' > ');

        console.info(`walletStore.${insideFn} set()`);
        if (cleanTrace !== insideFn) {
          console.info(`    via: ${cleanTrace}`);
        }
        const strobj = JSON.stringify(obj);
        console.info(`    value: ${strobj.slice(0, 90) + (strobj.length > 90 ? '...' : '')}`);
        return set(obj);
      };

      const storeObj = createState(wrappedSet, ...rest);

      if (storeObj && typeof storeObj === 'object') {
        return Object.fromEntries(
          Object.entries(storeObj).map(([key, value]) => {
            return [
              key,
              typeof value === 'function'
                ? (...args: any[]) => {
                    if (!key.startsWith('get')) {
                      insideFn = key;
                    }
                    return value(...args);
                  }
                : value,
            ];
          })
        );
      }

      return storeObj;
    }) as CreateState;
  }

  return createState;
}
