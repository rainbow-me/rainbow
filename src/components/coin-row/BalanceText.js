import { Text } from '../text';
import styled from '@/styled-thing';

const BalanceText = styled(Text).attrs(({ color, theme: { colors } }) => ({
  align: 'right',
  color: color || colors.dark,
  size: 'lmedium',
  weight: 'medium',
}))({});

export default BalanceText;
