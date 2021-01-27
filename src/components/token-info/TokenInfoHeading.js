import styled from 'styled-components';
import { Text } from '../text';

const TokenInfoHeading = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.alpha(colors.blueGreyDark, 0.5),
  letterSpacing: 'roundedMedium',
  size: 'smedium',
  weight: 'semibold',
}))``;

export default TokenInfoHeading;
