import PropTypes from 'prop-types';
import styled from 'styled-components/primitives';

export const getFlexStylesFromShorthand = style =>
  style === 'end' || style === 'start' ? `flex-${style}` : style;

const Flex = styled.View`
  ${({ flex }) => (flex !== undefined ? `flex: ${flex};` : '')}
  ${({ grow }) => (grow !== undefined ? `flex-grow: ${grow};` : '')}
  ${({ self }) =>
    self ? `align-self: ${getFlexStylesFromShorthand(self)};` : ''}
  ${({ shrink }) => (shrink !== undefined ? `flex-shrink: ${shrink};` : '')}
  align-items: ${({ align }) => getFlexStylesFromShorthand(align)};
  flex-direction: ${({ direction }) => direction};
  flex-wrap: ${({ wrap }) => (wrap ? 'wrap' : 'nowrap')};
  justify-content: ${({ justify }) => getFlexStylesFromShorthand(justify)};
`;

Flex.displayName = 'Flex';

Flex.propTypes = {
  align: PropTypes.oneOf(['baseline', 'center', 'end', 'start', 'stretch']),
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
  direction: 'row',
  justify: 'start',
};

export default Flex;
