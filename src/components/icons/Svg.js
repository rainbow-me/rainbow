import SvgPrimitive from 'react-native-svg';
import styled from 'styled-components/primitives';
import { reduceArrayToObject } from '../../utils';
import { PrimitiveWithoutOmittedProps } from '../layout';

const Svg = styled(PrimitiveWithoutOmittedProps).attrs(({ style }) => ({
  as: SvgPrimitive,
  blacklist: 'direction',
  style: reduceArrayToObject(style),
}))``;

export default Svg;
