import { FloatingPanels } from '../floating-panels';
import styled from '@rainbow-me/styled-components';

const ExchangeFloatingPanels = styled(FloatingPanels).attrs({
  margin: 0,
})({
  paddingTop: 24,
  transform: [{ translateY: ios ? 0 : -16 }],
  ...(android && { height: '85%' }),
});

export default ExchangeFloatingPanels;
