import { pick } from 'lodash';
import React from 'react';
import isEqual from 'react-fast-compare';

export default function magicMemo(Component, deps, customComparisonFunc) {
  return React.memo(Component, (prev, next) => {
    const magicDeps = typeof deps === 'string' ? [deps] : deps;
    const magicPrev = pick(prev, magicDeps);
    const magicNext = pick(next, magicDeps);

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
