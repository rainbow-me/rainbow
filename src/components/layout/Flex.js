import PropTypes from 'prop-types';
import React from 'react';
import { Animated } from 'react-native';
import styled from 'styled-components/native';

export const getFlexStylesFromShorthand = (style) => (
  (style === 'end' || style === 'start')
    ? `flex-${style}`
    : style
);

const Flex = styled(({
  align,
  direction,
  justify,
  wrap,
  ...rest
}) => <Animated.View {...rest} />)`
  align-items: ${({ align }) => getFlexStylesFromShorthand(align)};
  flex-direction: ${({ direction }) => direction};
  flex-wrap: ${({ wrap }) => (wrap ? 'wrap' : 'nowrap')};
  justify-content: ${({ justify }) => getFlexStylesFromShorthand(justify)};
`;

Flex.defaultProps = {
  align: 'stretch',
  direction: 'row',
  justify: 'start',
};

Flex.displayName = 'Flex';

Flex.propTypes = {
  align: PropTypes.oneOf(['baseline', 'center', 'end', 'start', 'stretch']),
  direction: PropTypes.oneOf(['row', 'column']),
  justify: PropTypes.oneOf(['center', 'end', 'space-around', 'space-between', 'start']),
  wrap: PropTypes.bool,
};

export default Flex;
