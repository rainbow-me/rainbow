import SvgPrimitive from 'react-native-svg';
import styled from 'styled-components/primitives';
import { reduceArrayToObject } from '../../utils';

const Svg = styled(SvgPrimitive)
  .withConfig({
    shouldForwardProp: prop => prop !== 'direction',
  })
  .attrs(({ style }) => ({ style: reduceArrayToObject(style) }))``;

export default Svg;
