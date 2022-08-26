import { isNil } from 'lodash';
import { css } from '@/styled-thing';

export default function buildLayoutStyles(values, type, shouldReturnCss) {
  // Replicating the CSS API, if no second value parameter is given
  // apply the first parameter as both horizontal and vertical values.
  const defaultHorizontal = !isNil(values[1]) ? values[1] : values[0];
  const separator = type ? '-' : '';

  const coordinates = {
    bottom: !isNil(values[2]) ? values[2] : values[0],
    left: !isNil(values[3]) ? values[3] : defaultHorizontal,
    right: defaultHorizontal,
    top: values[0],
  };

  return shouldReturnCss
    ? css`
        ${type}${separator}bottom: ${coordinates.bottom};
        ${type}${separator}left: ${coordinates.left};
        ${type}${separator}right: ${coordinates.right};
        ${type}${separator}top: ${coordinates.top};
      `
    : coordinates;
}

buildLayoutStyles.object = (values, type) => {
  const defaultHorizontal = !isNil(values[1]) ? values[1] : values[0];

  return {
    [type + 'Bottom']: !isNil(values[2]) ? values[2] : values[0],
    [type + 'Left']: !isNil(values[3]) ? values[3] : defaultHorizontal,
    [type + 'Right']: defaultHorizontal,
    [type + 'Top']: values[0],
  };
};
