const Decorated = Symbol();

type Combined<A, B> = A & B;

// eslint-disable-next-line @typescript-eslint/ban-types
export const withStaticProperties = <A extends Function, B extends Record<string, any>>(component: A, staticProps: B): Combined<A, B> => {
  // if already wrapped once, error, its an edge case we don't use:
  // @ts-expect-error its ok to attach symbol to function
  if (component[Decorated]) {
    throw new Error(`Already called withStaticProperties on component`);
  }

  // add new things
  Object.assign(component, staticProps);
  // @ts-expect-error its ok to attach symbol to function
  next[Decorated] = true;

  return component as Combined<A, B>;
};
