import styled from 'styled-components/primitives';
import { colors, fonts } from '../../styles';
import { Monospace } from '../text';

const BalanceText = styled(Monospace)`
  color: ${colors.blueGreyDark};
  font-size: ${fonts.size.lmedium};
`;

export default BalanceText;
