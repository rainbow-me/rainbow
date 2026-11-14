/**
 * Caches a pure getter until a selected state field changes by `Object.is`.
 */
export function memoizeState<State, Key extends keyof State & string, Result>(
  get: () => State,
  ...args: [Key, ...Key[], (state: Pick<State, Key>) => Result]
): () => Result {
  const keys: Key[] = [];
  let compute: (state: Pick<State, Key>) => Result;

  for (const arg of args) {
    typeof arg === 'string' ? keys.push(arg) : (compute = arg);
  }

  let inputs: State[Key][] | undefined;
  let value: Result;

  return () => {
    const state = get();

    if (inputs) {
      let index = 0;
      while (index < keys.length && Object.is(state[keys[index]], inputs[index])) index += 1;
      if (index === keys.length) return value;
    }

    value = compute(state);
    inputs ??= [];

    for (let index = 0; index < keys.length; index++) {
      inputs[index] = state[keys[index]];
    }

    return value;
  };
}
