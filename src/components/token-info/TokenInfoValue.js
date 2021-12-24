import { TruncatedText } from '../text';
import styled from 'rainbowed-components';

const TokenInfoValue = styled(TruncatedText).attrs(
  ({ color, isNft, theme: { colors }, size, weight = 'semibold' }) => ({
    color: color || colors.dark,
    letterSpacing: isNft ? 'rounded' : 'roundedTight',
    size: size || 'larger',
    weight,
  })
)({});

export default TokenInfoValue;
