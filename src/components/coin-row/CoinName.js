import styled from 'styled-components';
import { TruncatedText } from '../text';

const CoinName = styled(TruncatedText).attrs(
  ({ color, size, theme: { colors } }) => ({
    color: color || colors.dark,
    letterSpacing: 'roundedMedium',
    lineHeight: 'normal',
    size: size || 'lmedium',
  })
)`
  margin-top: ${android ? 1.5 : 0};
  padding-right: ${({ paddingRight = 19 }) => paddingRight};
`;

export default CoinName;
