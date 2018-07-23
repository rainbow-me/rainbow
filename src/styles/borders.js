import { upperFirst } from 'lodash';
import { css } from 'styled-components';
import colors from './colors';

const border = {};

border.color = colors.lightGrey;
border.radius = 6;
border.width = 1;

border.default = css`
  border-color: ${border.color};
  border-width: ${border.width};
`;

border.buildRadius = (direction, value = border.radius) => {
  if (direction === 'bottom' || direction === 'top') {
    return css`
      border-${upperFirst(direction)}-left-radius: ${value};
      border-${upperFirst(direction)}-right-radius: ${value};
    `;
  } else if (direction === 'left' || direction === 'right') {
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
