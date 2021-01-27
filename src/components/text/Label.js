import styled from 'styled-components';
import Text from './Text';

const Label = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.blueGreyDark,
  opacity: 0.6,
  size: 'h5',
  weight: 'semibold',
}))``;
export default Label;
