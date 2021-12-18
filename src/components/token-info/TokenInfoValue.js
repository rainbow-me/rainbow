import styled from 'styled-components';
import { TruncatedText } from '../text';

const TokenInfoValue = styled(TruncatedText).attrs(
  ({ color, isNft, theme: { colors }, size, weight = 'semibold' }) => ({
    color: color || colors.dark,
    letterSpacing: isNft ? 'rounded' : 'roundedTight',
    size: size || 'larger',
    weight,
  })
)({});

export default TokenInfoValue;
