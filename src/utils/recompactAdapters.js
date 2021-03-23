import React, { useCallback } from 'react';

export const withHandlers = handlers => Component =>
  function WithHandlers(props) {
    const traversedHandlers = Object.keys(handlers).reduce((acc, key) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks,react-hooks/exhaustive-deps
      acc[key] = useCallback(handlers[key](props), [Object.values(props)]);
      return acc;
    }, {});
    return <Component {...props} {...traversedHandlers} />;
  };

export function compose(...funcs) {
  if (funcs.length === 0) {
    return x => x;
  }

  if (funcs.length === 1) {
    return funcs[0];
  }

  return funcs.reduce((a, b) => (...args) => a(b(...args)));
}
