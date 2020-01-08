import { isNumber } from 'lodash';
import colors from './colors';

const addUnitToNumberValues = value => (isNumber(value) ? `${value}px` : value);

const shadow = {};

shadow.color = colors.black;
shadow.opacity = 0.4;

shadow.build = (
  x,
  y,
  radius,
  color = shadow.color,
  opacity = shadow.opacity
) => `
  shadow-color: ${color};
  shadow-offset: ${addUnitToNumberValues(x)} ${addUnitToNumberValues(y)};
  shadow-opacity: ${opacity};
  shadow-radius: ${addUnitToNumberValues(radius / 2)};
`;

export default shadow;
