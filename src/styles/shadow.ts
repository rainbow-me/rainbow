import { isNumber } from 'lodash';
import colors from './colors';

const addUnitToNumberValues = (value: any) =>
  isNumber(value) ? `${value}px` : value;

const shadow = {};

// @ts-expect-error ts-migrate(2339) FIXME: Property 'color' does not exist on type '{}'.
shadow.color = colors.black;
// @ts-expect-error ts-migrate(2339) FIXME: Property 'opacity' does not exist on type '{}'.
shadow.opacity = 0.4;

// @ts-expect-error ts-migrate(2339) FIXME: Property 'build' does not exist on type '{}'.
shadow.build = (
  x = 0,
  y = 0,
  radius = 0,
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'color' does not exist on type '{}'.
  color = shadow.color,
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'opacity' does not exist on type '{}'.
  opacity = shadow.opacity
) => `
  shadow-color: ${color};
  shadow-offset: ${addUnitToNumberValues(x)} ${addUnitToNumberValues(y)};
  shadow-opacity: ${opacity};
  shadow-radius: ${addUnitToNumberValues(radius / 2)};
`;

// @ts-expect-error ts-migrate(2339) FIXME: Property 'buildAsObject' does not exist on type '{... Remove this comment to see the full error message
shadow.buildAsObject = (
  // @ts-expect-error ts-migrate(7006) FIXME: Parameter 'x' implicitly has an 'any' type.
  x,
  // @ts-expect-error ts-migrate(7006) FIXME: Parameter 'y' implicitly has an 'any' type.
  y,
  // @ts-expect-error ts-migrate(7006) FIXME: Parameter 'radius' implicitly has an 'any' type.
  radius,
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'color' does not exist on type '{}'.
  color = shadow.color,
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'opacity' does not exist on type '{}'.
  opacity = shadow.opacity
) => ({
  shadowColor: color,

  shadowOffset: {
    height: y,
    width: x,
  },

  shadowOpacity: opacity,
  shadowRadius: radius,
});

export default shadow;
