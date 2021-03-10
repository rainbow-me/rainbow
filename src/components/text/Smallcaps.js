import styled from 'styled-components';
import Text from './Text';

const Smallcaps = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.alpha(colors.blueGreyDark, 0.8),
  size: 'small',
  uppercase: true,
  weight: 'semibold',
}))``;

export default Smallcaps;
