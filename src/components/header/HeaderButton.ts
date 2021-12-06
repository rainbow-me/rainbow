import styled from 'styled-components';
import { ButtonPressAnimation } from '../animations';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';

const HeaderButton = styled(ButtonPressAnimation).attrs(
  ({ scaleTo = 0.8, opacityTouchable = true }) => ({
    compensateForTransformOrigin: true,
    opacityTouchable,
    scaleTo,
  })
)`
  ${padding(10, 19, 8)};
`;

export default HeaderButton;
