import Text from './Text';
import styled from '@/styled-thing';

const H1 = styled(Text).attrs(({ letterSpacing = 'rounded', weight = 'heavy', color, theme: { colors } }) => ({
  color: color || colors.dark,
  letterSpacing,
  size: 'big',
  weight,
}))({});

export default H1;
