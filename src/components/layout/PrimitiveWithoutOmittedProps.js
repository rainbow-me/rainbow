import { pickBy } from 'lodash';
import React, { createElement, useCallback } from 'react';
import { View } from 'react-primitives';

// We need to do all this bullshit until `shouldForwardProp` supports React Native.
// It should be coming soon, just waiting for this commit to get published/released on npm.
// 👉️ https://github.com/styled-components/styled-components/commit/4add697ac770634300f7775fc880882b5497bdf4
//
// ....i tried a million different ways to just install styled-components directly from github using this commit
// but it doesnt work,)
const PrimitiveWithoutOmittedProps = (
  { as = View, blacklist, ...props },
  ref
) => {
  const filterProps = useCallback(
    (_, prop) => {
      const badProps = Array.isArray(blacklist) ? blacklist : [blacklist];
      return !badProps.includes(prop);
    },
    [blacklist]
  );

  return createElement(as, {
    ...pickBy(props, filterProps),
    ref,
  });
};

export default React.forwardRef(PrimitiveWithoutOmittedProps);
