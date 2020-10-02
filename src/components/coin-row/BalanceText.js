import styled from 'styled-components/primitives';
import { colors } from '../../styles';
import { Text } from '../text';

const BalanceText = styled(Text).attrs(({ color = colors.dark }) => ({
  align: 'right',
  color,
  size: 'lmedium',
}))``;

export default BalanceText;
