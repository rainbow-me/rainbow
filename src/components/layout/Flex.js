import omitProps from '@hocs/omit-props';
import PropTypes from 'prop-types';
import { Animated } from 'react-native';
import styled from 'styled-components/primitives';

export const getFlexStylesFromShorthand = style => (
  (style === 'end' || style === 'start')
    ? `flex-${style}`
    : style
);

const FlexPropTypes = {
  align: PropTypes.oneOf(['baseline', 'center', 'end', 'start', 'stretch']),
  direction: PropTypes.oneOf(['row', 'column']),
  justify: PropTypes.oneOf(['center', 'end', 'space-around', 'space-between', 'start']),
  wrap: PropTypes.bool,
};

const FlexElement = omitProps(...Object.keys(FlexPropTypes))(Animated.View);
const Flex = styled(FlexElement)`
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

Flex.propTypes = FlexPropTypes;

export default Flex;
