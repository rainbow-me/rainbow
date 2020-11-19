import styled from 'styled-components/primitives';
import { TruncatedText } from '../../../text';
import { colors } from '@rainbow-me/styles';

const ChartHeaderSubtitle = styled(TruncatedText).attrs(
  ({
    color = colors.alpha(colors.blueGreyDark, 0.8),
    letterSpacing = 'roundedMedium',
  }) => ({
    color,
    letterSpacing,
    size: 'larger',
    weight: 'medium',
  })
)`
  margin-left: ${android ? 6 : 0};
  ${android ? 'height: 38' : ''};
`;

export default ChartHeaderSubtitle;
