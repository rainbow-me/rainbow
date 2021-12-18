import styled from '@terrysahaidak/style-thing';
import { TruncatedText } from '../../../text';

const ChartHeaderSubtitle = styled(TruncatedText).attrs(
  ({
    theme: { colors },
    color = colors.alpha(colors.blueGreyDark, 0.8),
    letterSpacing = 'roundedMedium',
    testID,
    weight = 'bold',
  }) => ({
    color,
    letterSpacing,
    size: 'larger',
    testID,
    weight,
  })
)({
  flex: 1,
  ...(android ? { marginLeft: 9, marginVertical: -10 } : {}),
});

export default ChartHeaderSubtitle;
