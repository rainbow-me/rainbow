import { Text } from '../text';
import styled from '@/styled-thing';
import { fonts, fontWithWidth } from '@/styles';
import { opacity } from '@/data/opacity';

const TokenInfoHeading = styled(Text).attrs(({ color, isNft, theme: { colors } }) => ({
  color: color || opacity(isNft ? colors.whiteLabel : colors.blueGreyDark, 0.5),
  letterSpacing: isNft ? 'rounded' : 'roundedMedium',
  size: isNft ? 'lmedium' : 'smedium',
  weight: isNft ? 'bold' : 'semibold',
}))(({ isNft }) => fontWithWidth(isNft ? fonts.weight.bold : fonts.weight.semibold));

export default TokenInfoHeading;
