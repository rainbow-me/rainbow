import SvgPrimitive from 'react-native-svg';
import styled from '@/styled-thing';
import { calcDirectionToDegrees } from '@/styles';

const Svg = styled(SvgPrimitive).withConfig({
  shouldForwardProp: prop => prop !== 'direction',
})(({ direction }) => ({
  transform: [{ rotate: `${calcDirectionToDegrees(direction)}deg` }],
}));

export default Svg;
