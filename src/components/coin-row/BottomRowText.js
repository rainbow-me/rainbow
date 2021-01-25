import styled from 'styled-components/primitives';
import { withThemeContext } from '../../context/ThemeContext';
import { TruncatedText } from '../text';

const BottomRowText = withThemeContext(
  styled(TruncatedText).attrs(({ align = 'left', color, colors }) => ({
    align,
    color: color ? color : colors.alpha(colors.blueGreyDark, 0.5),
    size: 'smedium',
  }))``
);

export default BottomRowText;
