import { TruncatedText } from '../text';
import styled from '@rainbow-me/styled-components';

const CoinName = styled(TruncatedText).attrs(
  ({ color, size, theme: { colors } }) => ({
    color: color || colors.dark,
    letterSpacing: 'roundedMedium',
    lineHeight: 'normal',
    size: size || 'lmedium',
  })
)({
  marginTop: android ? 1.5 : 0,
  paddingRight: ({ paddingRight = 19 }) => paddingRight,
});

export default CoinName;
