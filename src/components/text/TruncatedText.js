import styled from 'styled-components/primitives';
import { withThemeContext } from '../../context/ThemeContext';
import Text from './Text';

const TruncatedText = withThemeContext(
  styled(Text).attrs(
    ({ ellipsizeMode = 'tail', numberOfLines = 1, color, colors }) => ({
      color: color ? color : colors.dark,
      ellipsizeMode,
      numberOfLines,
    })
  )``
);

export default TruncatedText;
