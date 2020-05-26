import AnimatedNumber from '@rainbow-me/react-native-animated-number';
import styled from 'styled-components/primitives';
import { buildTextStyles } from '../../styles';

const AnimatedNumberWithTextStyles = styled(AnimatedNumber)`
  ${buildTextStyles};
`;

export default AnimatedNumberWithTextStyles;
