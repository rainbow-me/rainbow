import { isNumber } from 'lodash';
import { css } from 'styled-components';
import colors from './colors';

const addUnitToNumberValues = value =>
  (isNumber(value) ? `${value}px` : value);

const shadow = {};

shadow.color = colors.alpha(colors.black, 0.04);

shadow.build = (x, y, radius, color = shadow.color) => css`
  box-shadow:
    ${addUnitToNumberValues(x)}
    ${addUnitToNumberValues(y)}
    ${addUnitToNumberValues(radius)}
    ${color};
`;

export default shadow;
