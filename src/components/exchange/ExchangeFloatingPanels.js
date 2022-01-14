import { FloatingPanels } from '../floating-panels';
import styled from '@rainbow-me/styled-components';

const ExchangeFloatingPanels = styled(FloatingPanels).attrs({
  margin: 0,
  translateY: ios ? 0 : -16,
})({
  paddingTop: 24,
  ...(android && { height: '85%' }),
});

export default ExchangeFloatingPanels;
