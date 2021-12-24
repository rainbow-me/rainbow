import AnimatedNumber from '@rainbow-me/react-native-animated-number';
import { buildTextStyles } from '@rainbow-me/styles';
import styled from 'rainbowed-components';

const AnimatedNumberWithTextStyles = styled(AnimatedNumber)(
  buildTextStyles.object
);

export default AnimatedNumberWithTextStyles;
