import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { isNumber } from 'lodash';
import { ViewStyle } from 'react-native';
import colors from './colors';

const addUnitToNumberValues = (value: string | number) => (isNumber(value) ? `${value}px` : value);

const defaultColor = colors.black;
const defaultOpacity = 0.4;

const build = (x = 0, y = 0, radius = 0, color = defaultColor, opacity = defaultOpacity) => `
  shadow-color: ${color};
  shadow-offset: ${addUnitToNumberValues(x)} ${addUnitToNumberValues(y)};
  shadow-opacity: ${opacity};
  shadow-radius: ${addUnitToNumberValues(radius / 2)};
`;

const buildAsObject = (x: number, y: number, radius: number, color = defaultColor, opacity = defaultOpacity, useBoxShadow = false) =>
  (useBoxShadow
    ? {
        boxShadow: [
          {
            offsetX: x,
            offsetY: y,
            blurRadius: radius,
            color: opacityWorklet(color, opacity),
          },
        ],
      }
    : {
        shadowColor: color,
        shadowOffset: {
          height: y,
          width: x,
        },
        shadowOpacity: opacity,
        shadowRadius: radius,
      }) satisfies ViewStyle;

export default {
  color: defaultColor,
  opacity: defaultOpacity,
  build,
  buildAsObject,
};
