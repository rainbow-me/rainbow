import styled from 'styled-components/primitives';
import Text from './Text';

const TruncatedText = styled(Text).attrs(
  ({ ellipsizeMode = 'tail', numberOfLines = 1 }) => ({
    ellipsizeMode,
    numberOfLines,
  })
)``;

export default TruncatedText;
