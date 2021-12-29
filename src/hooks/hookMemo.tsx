import React, { ReactChildren, useContext } from 'react';

let id = 0;

const hooks: {
  id: number;
  hook: () => any;
  context: React.Context<any>;
}[] = [];

export default function hookMemo<T>(hook: () => T): () => T {
  const currentId = id++;
  const context = React.createContext<T | undefined>(undefined);
  hooks.push({ context, hook, id: currentId });
  return function useHook(): T {
    return useContext(context)!;
  };
}

let cachedComponents: undefined | typeof React.Component[] = undefined;

function getHierarchy(): typeof React.Component[] {
  if (cachedComponents) {
    return cachedComponents;
  }
  const components = hooks.reduce((acc, curr) => {
    const Component = function HookMemoizer({
      children,
    }: {
      children: ReactChildren;
    }) {
      const value = curr.hook();
      const Context = curr.context;
      return <Context.Provider value={value}>{children}</Context.Provider>;
    };
    acc.push((Component as unknown) as typeof React.Component);
    return acc;
  }, [] as typeof React.Component[]);

  cachedComponents = components;
  return components;
}

function hierarchyToComponent(
  hierarchy: typeof React.Component[],
  children: ReactChildren,
  index = 0
) {
  const Component = hierarchy[index];
  const isLast = index === hierarchy.length - 1;
  return (
    <Component>
      {isLast ? children : hierarchyToComponent(hierarchy, children, index + 1)}{' '}
    </Component>
  );
}

export function HooksMemoizationManager({
  children,
}: {
  children: ReactChildren;
}) {
  const hierarchy = getHierarchy();
  return hierarchyToComponent(hierarchy, children);
}
