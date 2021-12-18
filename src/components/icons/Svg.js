import styled from '@terrysahaidak/style-thing';
import SvgPrimitive from 'react-native-svg';
import { calcDirectionToDegrees } from '@rainbow-me/styles';

const Svg = styled(SvgPrimitive).withConfig({
  shouldForwardProp: prop => prop !== 'direction',
})(({ direction }) => ({
  transform: [{ rotate: `${calcDirectionToDegrees(direction)}deg` }],
}));

export default Svg;
