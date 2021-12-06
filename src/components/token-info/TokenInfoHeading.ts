import styled from 'styled-components';
import { Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
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
)`
${isNft => fontWithWidth(isNft ? fonts.weight.bold : fonts.weight.semibold)}}`;

export default TokenInfoHeading;
