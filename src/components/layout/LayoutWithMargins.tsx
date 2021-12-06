import React, { Children, cloneElement, useMemo } from 'react';
import flattenChildren from 'react-flatten-children';
import Flex from './Flex';

const LayoutWithMargins = (
  { children, direction, margin, marginKey, ...props }: any,
  ref: any
) => {
  const marginValues = useMemo(() => {
    const reverse = direction.includes('reverse');
    return [reverse ? 0 : margin, reverse ? margin : 0];
  }, [direction, margin]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Flex {...props} direction={direction} ref={ref}>
      {Children.toArray(flattenChildren(children)).map((child, index, array) =>
        // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
        cloneElement(child, {
          style: [
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'props' does not exist on type 'ReactChil... Remove this comment to see the full error message
            child?.props?.style,
            { [marginKey]: marginValues[index < array.length - 1 ? 0 : 1] },
          ],
        })
      )}
    </Flex>
  );
};

export default React.forwardRef(LayoutWithMargins);
