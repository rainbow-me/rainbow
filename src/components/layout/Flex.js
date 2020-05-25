import PropTypes from 'prop-types';
import styled from 'styled-components/primitives';
import { buildFlexStyles } from '../../styles';
import PrimitiveWithoutOmittedProps from './PrimitiveWithoutOmittedProps';

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

const Flex = styled(PrimitiveWithoutOmittedProps).attrs({
  blacklist: Object.keys(flexPropTypes),
})`
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
