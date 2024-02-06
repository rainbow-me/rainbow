import PropTypes from 'prop-types';
import styled from '@/styled-thing';
import { buildFlexStyles } from '@/styles';
import { memoFn } from '@/utils/memoFn';

const flexPropTypes = {
  align: PropTypes.oneOf(['baseline', 'center', 'end', 'start', 'stretch']),
  direction: PropTypes.oneOf(['column', 'column-reverse', 'row', 'row-reverse']),
  flex: PropTypes.number,
  grow: PropTypes.number,
  justify: PropTypes.oneOf(['center', 'end', 'space-around', 'space-between', 'start']),
  self: PropTypes.oneOf(['center', 'end', 'start', 'stretch']),
  shrink: PropTypes.number,
  wrap: PropTypes.bool,
};

const propTypesKeys = Object.keys(flexPropTypes);

const validatorFn = memoFn(prop => {
  return !propTypesKeys.includes(prop);
});

const Flex = styled.View.withConfig({
  // We need to prevent the buildFlexStyles-related props from being
  // passed to the root element because our namespace collides with some native props
  shouldForwardProp: (prop, defaultValidatorFn) => validatorFn(prop) && defaultValidatorFn(prop),
})(buildFlexStyles.object);

Flex.displayName = 'Flex';

Flex.propTypes = flexPropTypes;

export default Flex;
