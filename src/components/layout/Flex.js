import { pickBy } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { View } from 'react-primitives';
import styled from 'styled-components/primitives';
import { buildFlexStyles } from '../../styles';

const flexPropTypes = {
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

const blacklist = Object.keys(flexPropTypes);
const filterProps = (_, prop) => !blacklist.includes(prop);
const FlexPrimitive = React.forwardRef((props, ref) => (
  <View {...pickBy(props, filterProps)} ref={ref} />
));
FlexPrimitive.displayName = 'FlexPrimitive';

const Flex = styled(FlexPrimitive)`
  ${buildFlexStyles};
`;

Flex.displayName = 'Flex';

Flex.propTypes = flexPropTypes;

Flex.defaultProps = {
  align: 'stretch',
  direction: 'row',
  justify: 'start',
};

export default Flex;
