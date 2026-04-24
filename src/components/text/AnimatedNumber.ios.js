import styled from '@/framework/ui/styled-thing';
import { buildTextStyles } from '@/styles';
import AnimatedNumber from '@rainbow-me/react-native-animated-number';

const AnimatedNumberWithTextStyles = styled(AnimatedNumber)(buildTextStyles.object);

export default AnimatedNumberWithTextStyles;
