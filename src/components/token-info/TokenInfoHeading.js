import styled from 'styled-components';
import { Text } from '../text';

const TokenInfoHeading = styled(Text).attrs(
  ({ color, isNft, theme: { colors } }) => ({
    color:
      color ||
      colors.alpha(isNft ? colors.whiteLabel : colors.blueGreyDark, 0.5),
    letterSpacing: isNft ? 'rounded' : 'roundedMedium',
    size: isNft ? 'lmedium' : 'smedium',
    weight: isNft ? 'bold' : 'semibold',
  })
)``;

export default TokenInfoHeading;
