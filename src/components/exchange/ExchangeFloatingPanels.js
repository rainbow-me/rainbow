import styled from 'styled-components';
import { FloatingPanels } from '../floating-panels';

const ExchangeFloatingPanels = styled(FloatingPanels).attrs({
  margin: 0,
  translateY: -16,
})`
  padding-top: 24;
  height: 85%;
`;

export default ExchangeFloatingPanels;
