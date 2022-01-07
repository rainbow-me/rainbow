import AnimatedNumber from '@rainbow-me/react-native-animated-number';
import { buildTextStyles } from '@rainbow-me/styles';
import styled from '@rainbow-me/styled-components';

const AnimatedNumberWithTextStyles = styled(AnimatedNumber)(
  buildTextStyles.object
);

export default AnimatedNumberWithTextStyles;
