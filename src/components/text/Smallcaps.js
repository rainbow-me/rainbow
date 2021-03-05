import styled from 'styled-components';
import Text from './Text';

const Smallcaps = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.blueGreyDark80,
  size: 'small',
  uppercase: true,
  weight: 'semibold',
}))``;

export default Smallcaps;
