import styled from '@terrysahaidak/style-thing';
import { Text } from '../text';
import { fonts, fontWithWidth } from '@rainbow-me/styles';

const TokenInfoHeading = styled(Text).attrs(
  ({ color, isNft, theme: { colors } }) => ({
    color:
      color ||
      colors.alpha(isNft ? colors.whiteLabel : colors.blueGreyDark, 0.5),
    letterSpacing: isNft ? 'rounded' : 'roundedMedium',
    size: isNft ? 'lmedium' : 'smedium',
    weight: isNft ? 'bold' : 'semibold',
  })
)(({ isNft }) =>
  fontWithWidth(isNft ? fonts.weight.bold : fonts.weight.semibold)
);

export default TokenInfoHeading;
