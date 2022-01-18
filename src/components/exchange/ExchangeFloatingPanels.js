import { Platform } from 'react-native';
import styled from 'styled-components';
import { FloatingPanels } from '../floating-panels';

const ExchangeFloatingPanels = styled(FloatingPanels).attrs({
  margin: 0,
  translateY: ios ? 0 : -16,
})`
  padding-top: 24;
  ${Platform.select({ android: 'height: 85%;', ios: '' })}
`;

export default ExchangeFloatingPanels;
