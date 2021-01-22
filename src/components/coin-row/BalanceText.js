import styled from 'styled-components/primitives';
import { colors_NOT_REACTIVE } from '../../styles';
import { Text } from '../text';

const BalanceText = styled(Text).attrs(
  ({ color = colors_NOT_REACTIVE.dark }) => ({
    align: 'right',
    color,
    size: 'lmedium',
  })
)``;

export default BalanceText;
