import styled from '@/framework/ui/styled-thing';
import { opacity } from '@/framework/ui/utils/opacity';
import { fonts, fontWithWidth } from '@/styles';

import { Text } from '../text';

const TokenInfoHeading = styled(Text).attrs(({ color, isNft, theme: { colors } }) => ({
  color: color || opacity(isNft ? colors.whiteLabel : colors.blueGreyDark, 0.5),
  letterSpacing: isNft ? 'rounded' : 'roundedMedium',
  size: isNft ? 'lmedium' : 'smedium',
  weight: isNft ? 'bold' : 'semibold',
}))(({ isNft }) => fontWithWidth(isNft ? fonts.weight.bold : fonts.weight.semibold));

export default TokenInfoHeading;
