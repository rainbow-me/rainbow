import styled from 'styled-components';
import Text from './Text';

const TruncatedText = styled(Text).attrs(
  ({ ellipsizeMode = 'tail', numberOfLines = 1, testID }) => ({
    ellipsizeMode,
    numberOfLines,
    testID,
  })
)``;

export default TruncatedText;
