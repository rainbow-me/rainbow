import RNAnimatedNumber from '@rainbow-me/react-native-animated-number';
import styled from 'styled-components/primitives';
import { buildTextStyles } from '../../styles';

const AnimatedNumber = styled(RNAnimatedNumber)`
  ${buildTextStyles};
`;

export default AnimatedNumber;
