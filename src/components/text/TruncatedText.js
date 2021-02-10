import styled from 'styled-components';
import Text from './Text';

const TruncatedText = styled(Text).attrs(
  ({
    ellipsizeMode = 'tail',
    numberOfLines = 1,
    color,
    theme: { colors },
  }) => ({
    color: color ? color : colors.dark,
    ellipsizeMode,
    numberOfLines,
  })
)``;

export default TruncatedText;
