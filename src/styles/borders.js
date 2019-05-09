import { upperFirst } from 'lodash';
import { css } from 'styled-components';
import colors from './colors';
import position from './position';

const border = {};

border.color = colors.lightGrey;
border.radius = 6;
border.width = 1;

border.default = css`
  border-color: ${border.color};
  border-width: ${border.width};
`;

border.buildCircle = size => css`
  ${position.size(size)};
  border-radius: ${size / 2};
`;

border.buildCircleAsObject = size => ({
  ...position.sizeAsObject(size),
  borderRadius: size / 2,
});

border.buildRadius = (direction, value = border.radius) => {
  if (direction === 'bottom' || direction === 'top') {
    return css`
      border-${upperFirst(direction)}-left-radius: ${value};
      border-${upperFirst(direction)}-right-radius: ${value};
    `;
  }
  if (direction === 'left' || direction === 'right') {
    return css`
      border-bottom-${upperFirst(direction)}-radius: ${value};
      border-top-${upperFirst(direction)}-radius: ${value};
    `;
  }

  return css`
    border-bottom-left-radius: ${value};
    border-bottom-right-radius: ${value};
    border-top-left-radius: ${value};
    border-top-right-radius: ${value};
  `;
};

export default border;
