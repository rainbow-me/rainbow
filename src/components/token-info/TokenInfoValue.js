import { TruncatedText } from '../text';
import styled from '@rainbow-me/styled';

const TokenInfoValue = styled(TruncatedText).attrs(
  ({ color, isNft, theme: { colors }, size, weight = 'semibold' }) => ({
    color: color || colors.dark,
    letterSpacing: isNft ? 'rounded' : 'roundedTight',
    size: size || 'larger',
    weight,
  })
)({});

export default TokenInfoValue;
