import { TruncatedText } from '../text';
import styled from '@rainbow-me/styled-components';

const TokenInfoValue = styled(TruncatedText).attrs(
  ({ color, isNft, lineHeight, size, theme: { colors }, weight = 'semibold' }) => ({
    color: color || colors.dark,
    lineHeight: lineHeight,
    letterSpacing: isNft ? 'rounded' : 'roundedTight',
    size: size || 'larger',
    weight,
  })
)({});

export default TokenInfoValue;
