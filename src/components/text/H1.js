import styled from 'styled-components';
import { withThemeContext } from '../../context/ThemeContext';
import Text from './Text';

const H1 = withThemeContext(
  styled(Text).attrs(
    ({ letterSpacing = 'rounded', weight = 'bold', color, colors }) => ({
      color: color || colors.dark,
      letterSpacing,
      size: 'big',
      weight,
    })
  )``
);

export default H1;
