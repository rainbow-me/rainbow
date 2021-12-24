import { Text } from '../text';
import styled from 'rainbowed-components';

const BalanceText = styled(Text).attrs(({ color, theme: { colors } }) => ({
  align: 'right',
  color: color || colors.dark,
  size: 'lmedium',
}))({});

export default BalanceText;
