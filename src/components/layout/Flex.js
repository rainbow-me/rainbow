import PropTypes from 'prop-types';
import styled from 'styled-components/primitives';
import { buildFlexStyles } from '@rainbow-me/styles';

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

const Flex = styled.View.withConfig({
  // We need to prevent the buildFlexStyles-related props from being
  // passed to the root element because our namespace collides with some native props
  shouldForwardProp: (prop, defaultValidatorFn) =>
    !Object.keys(flexPropTypes).includes(prop) && defaultValidatorFn(prop),
})`
  ${buildFlexStyles};
`;

Flex.displayName = 'Flex';

Flex.propTypes = flexPropTypes;

export default Flex;
