import React, { Children, createElement, Fragment, useMemo } from 'react';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../Divider' was resolved to '/Users/nickby... Remove this comment to see the full error message
import Divider from '../Divider';
import Flex from './Flex';

const LayoutWithDividers = (
  { children, dividerHorizontal, dividerRenderer = Divider, ...props }: any,
  ref: any
) => {
  const dividerProps = useMemo(() => ({ horizontal: dividerHorizontal }), [
    dividerHorizontal,
  ]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Flex {...props} ref={ref}>
      {Children.toArray(children).map((child, index, array) => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Fragment key={index}>
          {child}
          {index < array.length - 1
            ? createElement(dividerRenderer, dividerProps)
            : null}
        </Fragment>
      ))}
    </Flex>
  );
};

export default React.forwardRef(LayoutWithDividers);
