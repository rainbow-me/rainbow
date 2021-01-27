import styled from 'styled-components';
import { Text } from '../text';

const BalanceText = styled(Text).attrs(({ color, theme: { colors } }) => ({
  align: 'right',
  color: color || colors.dark,
  size: 'lmedium',
}))``;

export default BalanceText;
