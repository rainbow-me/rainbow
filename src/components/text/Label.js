import Text from './Text';
import styled from '@rainbow-me/styled-components';

const Label = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.blueGreyDark,
  opacity: 0.6,
  size: 'h5',
  weight: 'semibold',
}))({});
export default Label;
