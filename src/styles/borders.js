import { upperFirst } from 'lodash';
import colors from './colors';
import position from './position';
import { css } from '@/styled-thing';

const border = {};

border.color = colors.lighterGrey;
border.radius = 6;
border.width = 1;

border.default = css`
  border-color: ${border.color};
  border-width: ${border.width};
`;

border.buildCircle = size => `
  ${position.size(size)};
  border-radius: ${size / 2};
`;

border.buildCircleAsObject = size => ({
  ...position.sizeAsObject(size),
  borderRadius: size / 2,
});

border.buildRadius = (direction, value = border.radius) => {
  if (direction === 'bottom' || direction === 'top') {
    return `
      border-${direction}-left-radius: ${value};
      border-${direction}-right-radius: ${value};
    `;
  }
  if (direction === 'left' || direction === 'right') {
    return `
      border-bottom-${direction}-radius: ${value};
      border-top-${direction}-radius: ${value};
    `;
  }

  return `
    border-bottom-left-radius: ${value};
    border-bottom-right-radius: ${value};
    border-top-left-radius: ${value};
    border-top-right-radius: ${value};
  `;
};

border.buildRadiusAsObject = (direction, value = border.radius) => {
  if (direction === 'bottom' || direction === 'top') {
    return {
      [`border${upperFirst(direction)}LeftRadius`]: value,
      [`border${upperFirst(direction)}RightRadius`]: value,
    };
  }
  if (direction === 'left' || direction === 'right') {
    return {
      [`borderBottom${upperFirst(direction)}Radius`]: value,
      [`borderTop${upperFirst(direction)}Radius`]: value,
    };
  }

  return {
    borderBottomLeftRadius: value,
    borderBottomRightRadius: value,
    borderTopLeftRadius: value,
    borderTopRightRadius: value,
  };
};

export default border;
