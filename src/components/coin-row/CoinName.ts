import styled from 'styled-components';
import { TruncatedText } from '../text';

const CoinName = styled(TruncatedText).attrs(
  ({ color, size, theme: { colors } }) => ({
    color: color || colors.dark,
    letterSpacing: 'roundedMedium',
    lineHeight: android ? 'normalTight' : 'normal',
    size: size || 'lmedium',
  })
)`
  padding-right: ${({ paddingRight = 19 }) => paddingRight};
`;

export default CoinName;
