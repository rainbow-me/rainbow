import SvgPrimitive from 'react-native-svg';
import { calcDirectionToDegrees } from '@rainbow-me/styles';
import styled from '@rainbow-me/styled-components';

const Svg = styled(SvgPrimitive).withConfig({
  shouldForwardProp: prop => prop !== 'direction',
})(({ direction }) => ({
  transform: [{ rotate: `${calcDirectionToDegrees(direction)}deg` }],
}));

export default Svg;
