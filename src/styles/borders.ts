import { upperFirst } from 'lodash';
import { css } from 'styled-components';
import colors from './colors';
import position from './position';

const border = {};

// @ts-expect-error ts-migrate(2339) FIXME: Property 'color' does not exist on type '{}'.
border.color = colors.lighterGrey;
// @ts-expect-error ts-migrate(2339) FIXME: Property 'radius' does not exist on type '{}'.
border.radius = 6;
// @ts-expect-error ts-migrate(2339) FIXME: Property 'width' does not exist on type '{}'.
border.width = 1;

// @ts-expect-error ts-migrate(2339) FIXME: Property 'default' does not exist on type '{}'.
border.default = css`
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'color' does not exist on type '{}'.
  border-color: ${border.color};
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'width' does not exist on type '{}'.
  border-width: ${border.width};
`;

// @ts-expect-error ts-migrate(2339) FIXME: Property 'buildCircle' does not exist on type '{}'... Remove this comment to see the full error message
border.buildCircle = (size: any) => `
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'size' does not exist on type '{}'.
  ${position.size(size)};
  border-radius: ${size / 2};
`;

// @ts-expect-error ts-migrate(2339) FIXME: Property 'buildCircleAsObject' does not exist on t... Remove this comment to see the full error message
border.buildCircleAsObject = (size: any) => ({
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'sizeAsObject' does not exist on type '{}... Remove this comment to see the full error message
  ...position.sizeAsObject(size),
  borderRadius: size / 2,
});

// @ts-expect-error ts-migrate(2339) FIXME: Property 'buildRadius' does not exist on type '{}'... Remove this comment to see the full error message
border.buildRadius = (direction: any, value = border.radius) => {
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

// @ts-expect-error ts-migrate(2339) FIXME: Property 'buildRadiusAsObject' does not exist on t... Remove this comment to see the full error message
border.buildRadiusAsObject = (direction: any, value = border.radius) => {
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
