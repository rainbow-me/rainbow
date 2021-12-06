import PropTypes from 'prop-types';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
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

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const Flex = styled.View.withConfig({
  // We need to prevent the buildFlexStyles-related props from being
  // passed to the root element because our namespace collides with some native props
  shouldForwardProp: (prop: any, defaultValidatorFn: any) =>
    !Object.keys(flexPropTypes).includes(prop) && defaultValidatorFn(prop),
})`
  ${buildFlexStyles};
`;

Flex.displayName = 'Flex';

Flex.propTypes = flexPropTypes;

export default Flex;
