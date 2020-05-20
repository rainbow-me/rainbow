import PropTypes from 'prop-types';
import { createElement, forwardRef, useMemo } from 'react';
import { View } from 'react-primitives';

export const getFlexStyleKeysFromShorthand = style =>
  style === 'end' || style === 'start' ? `flex-${style}` : style;

const Flex = forwardRef(
  (
    {
      align,
      component,
      direction,
      flex: flexProp,
      justify,
      self,
      style,
      wrap,
      ...props
    },
    ref
  ) => {
    const flexStyles = useMemo(
      () => ({
        ...(self ? { alignSelf: getFlexStyleKeysFromShorthand(self) } : {}),
        ...(flexProp ? { flex: flexProp } : {}),
        alignItems: getFlexStyleKeysFromShorthand(align),
        flexDirection: direction,
        flexWrap: wrap ? 'wrap' : 'nowrap',
        justifyContent: getFlexStyleKeysFromShorthand(justify),
      }),
      [align, direction, flexProp, justify, self, wrap]
    );

    return createElement(component, {
      ref,
      style: [flexStyles, style],
      ...props,
    });
  }
);

Flex.displayName = 'Flex';

Flex.propTypes = {
  align: PropTypes.oneOf(['baseline', 'center', 'end', 'start', 'stretch']),
  component: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  direction: PropTypes.oneOf([
    'column',
    'column-reverse',
    'row',
    'row-reverse',
  ]),
  flex: PropTypes.number,
  justify: PropTypes.oneOf([
    'center',
    'end',
    'space-around',
    'space-between',
    'start',
  ]),
  self: PropTypes.oneOf(['center', 'end', 'start', 'stretch']),
  wrap: PropTypes.bool,
};

Flex.defaultProps = {
  align: 'stretch',
  component: View,
  direction: 'row',
  justify: 'start',
};

export default Flex;
