import omitProps from '@hocs/omit-props';
import PropTypes from 'prop-types';
import React from 'react';
import { View } from 'react-primitives';
import { componentFromProp } from 'recompact';
import styled from 'styled-components/primitives';

export const getFlexStyleKeysFromShorthand = style => (
  (style === 'end' || style === 'start')
    ? `flex-${style}`
    : style
);

const DefaultFlexView = props => <View {...props} />;

const FlexPropBlacklist = ['align', 'direction', 'flex', 'justify', 'wrap'];
const FlexElement = omitProps(...FlexPropBlacklist)(componentFromProp('component'));

const Flex = styled(FlexElement)`
  ${({ self }) => (self ? `align-self: ${getFlexStyleKeysFromShorthand(self)};` : null)}
  ${({ flex }) => (flex ? `flex: ${flex};` : null)}
  align-items: ${({ align }) => getFlexStyleKeysFromShorthand(align)};
  flex-direction: ${({ direction }) => direction};
  flex-wrap: ${({ wrap }) => (wrap ? 'wrap' : 'nowrap')};
  justify-content: ${({ justify }) => getFlexStyleKeysFromShorthand(justify)};
`;

Flex.displayName = 'Flex';

Flex.propTypes = {
  align: PropTypes.oneOf(['baseline', 'center', 'end', 'start', 'stretch']),
  component: PropTypes.func,
  direction: PropTypes.oneOf(['column', 'column-reverse', 'row', 'row-reverse']),
  flex: PropTypes.number,
  justify: PropTypes.oneOf(['center', 'end', 'space-around', 'space-between', 'start']),
  self: PropTypes.oneOf(['center', 'end', 'start', 'stretch']),
  wrap: PropTypes.bool,
};

Flex.defaultProps = {
  align: 'stretch',
  component: DefaultFlexView,
  direction: 'row',
  justify: 'start',
};

export default Flex;
