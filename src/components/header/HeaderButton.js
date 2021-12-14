import styled from 'styled-components';
import { ButtonPressAnimation } from '../animations';
import { padding } from '@rainbow-me/styles';

const HeaderButton = styled(ButtonPressAnimation).attrs(
  ({ scaleTo = 0.8, opacityTouchable = true }) => ({
    compensateForTransformOrigin: true,
    opacityTouchable,
    scaleTo,
  })
)`
  ${({ paddingLeft = 19, paddingRight = 19 }) =>
    padding(10, paddingRight, 8, paddingLeft)}
`;

export default HeaderButton;
