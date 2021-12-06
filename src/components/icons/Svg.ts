import SvgPrimitive from 'react-native-svg';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { calcDirectionToDegrees } from '@rainbow-me/styles';

const Svg = styled(SvgPrimitive).withConfig({
  // @ts-expect-error ts-migrate(2367) FIXME: This condition will always return 'true' since the... Remove this comment to see the full error message
  shouldForwardProp: prop => prop !== 'direction',
})`
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'direction' does not exist on type 'SvgPr... Remove this comment to see the full error message
  transform: rotate(${({ direction }) => calcDirectionToDegrees(direction)}deg);
`;

export default Svg;
