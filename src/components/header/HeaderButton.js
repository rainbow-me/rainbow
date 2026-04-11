import styled from '@/framework/ui/styled-thing';
import { padding } from '@/styles';

import ButtonPressAnimation from '../animations/ButtonPressAnimation';

const HeaderButton = styled(ButtonPressAnimation).attrs(({ scaleTo = 0.8, opacityTouchable = true }) => ({
  compensateForTransformOrigin: true,
  opacityTouchable,
  scaleTo,
}))(({ paddingLeft = 19, paddingRight = 19 }) => padding.object(10, paddingRight, 8, paddingLeft));

export default HeaderButton;
