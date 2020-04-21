import PropTypes from 'prop-types';
import { createElement, forwardRef } from 'react';
import { View } from 'react-primitives';

export const getFlexStyleKeysFromShorthand = style =>
  style === 'end' || style === 'start' ? `flex-${style}` : style;

const Flex = forwardRef(
  (
    {
      align,
      component,
      direction,
      flex,
      grow,
      justify,
      self,
      shrink,
      wrap,
      ...props
    },
    ref
  ) => {
    return createElement(component, {
      alignItems: getFlexStyleKeysFromShorthand(align),
      alignSelf: getFlexStyleKeysFromShorthand(self),
      flex,
      flexDirection: direction,
      flexGrow: grow,
      flexShrink: shrink,
      flexWrap: wrap ? 'wrap' : 'nowrap',
      justifyContent: getFlexStyleKeysFromShorthand(justify),
      ...props,
      ref,
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
  grow: PropTypes.number,
  justify: PropTypes.oneOf([
    'center',
    'end',
    'space-around',
    'space-between',
    'start',
  ]),
  self: PropTypes.oneOf(['center', 'end', 'start', 'stretch']),
  shrink: PropTypes.number,
  wrap: PropTypes.bool,
};

Flex.defaultProps = {
  align: 'stretch',
  component: View,
  direction: 'row',
  justify: 'start',
};

export default Flex;
