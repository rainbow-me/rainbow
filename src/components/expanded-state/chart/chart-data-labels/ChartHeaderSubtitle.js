import styled from 'styled-components/primitives';
import { TruncatedText } from '../../../text';
import { colors_NOT_REACTIVE } from '@rainbow-me/styles';

const ChartHeaderSubtitle = styled(TruncatedText).attrs(
  ({
    color = colors_NOT_REACTIVE.alpha(colors_NOT_REACTIVE.blueGreyDark, 0.8),
    letterSpacing = 'roundedMedium',
    weight = 'bold',
  }) => ({
    color,
    letterSpacing,
    size: 'larger',
    weight,
  })
)`
  margin-left: ${android ? 6 : 0};
  ${android ? 'height: 38' : ''};
`;

export default ChartHeaderSubtitle;
