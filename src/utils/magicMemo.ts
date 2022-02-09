import { pick } from 'lodash';
import React, {
  ComponentProps,
  ComponentType,
  MemoExoticComponent,
} from 'react';
import isEqual from 'react-fast-compare';

type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export default function magicMemo<C extends ComponentType<any>>(
  Component: C,
  deps: string | string[], // This type should ideally be constrained to prop keys, but we sometimes pass in path strings like `"prop.object.key"`
  customComparisonFunc?: (props: DeepPartial<ComponentProps<C>>) => boolean
): MemoExoticComponent<C> {
  return React.memo(Component, (prev, next) => {
    const magicDeps = typeof deps === 'string' ? [deps] : deps;
    const magicPrev = pick(prev, magicDeps) as DeepPartial<ComponentProps<C>>;
    const magicNext = pick(next, magicDeps) as DeepPartial<ComponentProps<C>>;

    if (customComparisonFunc) {
      return (
        customComparisonFunc(magicPrev) === customComparisonFunc(magicNext)
      );
    }

    if (magicDeps.length === 1) {
      return magicPrev === magicNext;
    }

    return isEqual(magicPrev, magicNext);
  });
}
