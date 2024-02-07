import AnimatedNumber from '@rainbow-me/react-native-animated-number';
import styled from '@/styled-thing';
import { buildTextStyles } from '@/styles';

const AnimatedNumberWithTextStyles = styled(AnimatedNumber)(buildTextStyles.object);

export default AnimatedNumberWithTextStyles;
