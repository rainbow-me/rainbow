import { TruncatedText } from '../text';
import styled from '@/styled-thing';

const CoinName = styled(TruncatedText).attrs(({ color, size, theme: { colors } }) => ({
  color: color || colors.dark,
  letterSpacing: 'roundedMedium',
  lineHeight: 'normal',
  size: size || 'lmedium',
  weight: 'semibold',
}))({
  marginTop: android ? 1.5 : 0,
  paddingRight: ({ paddingRight = 19 }) => paddingRight,
});

export default CoinName;
