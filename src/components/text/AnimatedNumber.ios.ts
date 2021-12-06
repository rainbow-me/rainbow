// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module '@rai... Remove this comment to see the full error message
import AnimatedNumber from '@rainbow-me/react-native-animated-number';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { buildTextStyles } from '@rainbow-me/styles';

const AnimatedNumberWithTextStyles = styled(AnimatedNumber)`
  ${buildTextStyles};
`;

export default AnimatedNumberWithTextStyles;
