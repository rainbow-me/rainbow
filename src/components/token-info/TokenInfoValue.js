import { TruncatedText } from '../text';
import styled from '@/styled-thing';

const TokenInfoValue = styled(TruncatedText).attrs(({ color, isNft, lineHeight, size, theme: { colors }, weight = 'semibold' }) => ({
  color: color || colors.dark,
  letterSpacing: isNft ? 'rounded' : 'roundedTight',
  lineHeight: lineHeight,
  size: size || 'larger',
  weight,
}))({});

export default TokenInfoValue;
