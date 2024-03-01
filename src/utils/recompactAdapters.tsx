import React, { useCallback } from 'react';

export const withHandlers = (handlers: any) => (Component: any) =>
  function WithHandlers(props: any) {
    const traversedHandlers = Object.keys(handlers).reduce((acc, key) => {
      // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      // eslint-disable-next-line react-hooks/rules-of-hooks,react-hooks/exhaustive-deps
      acc[key] = useCallback(handlers[key](props), [Object.values(props)]);
      return acc;
    }, {});
    return <Component {...props} {...traversedHandlers} />;
  };

export function compose(...funcs: any[]) {
  if (funcs.length === 0) {
    return (x: any) => x;
  }

  if (funcs.length === 1) {
    return funcs[0];
  }

  return funcs.reduce(
    (a, b) =>
      (...args: any[]) =>
        a(b(...args))
  );
}
