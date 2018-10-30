import { isNumber } from 'lodash';
import { css } from 'styled-components';
import colors from './colors';

const addUnitToNumberValues = value =>
  (isNumber(value) ? `${value}px` : value);

const shadow = {};

shadow.color = colors.alpha(colors.black, 0.04);

shadow.build = (...options) => css`
  box-shadow: ${shadow.buildString(...options)};
`;

shadow.buildString = (x, y, radius, color = shadow.color) => (
  `${addUnitToNumberValues(x)} ${addUnitToNumberValues(y)} ${addUnitToNumberValues(radius)} ${color}`
);

export default shadow;
