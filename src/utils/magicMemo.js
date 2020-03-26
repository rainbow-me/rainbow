import { pick } from 'lodash';
import React from 'react';
import isEqual from 'react-fast-compare';

export default function magicMemo(Component, deps) {
  return React.memo(Component, (prev, next) => {
    if (typeof deps === 'string') {
      return pick(prev, [deps]) === pick(next, [deps]);
    }

    return isEqual(pick(prev, deps), pick(next, deps));
  });
}
