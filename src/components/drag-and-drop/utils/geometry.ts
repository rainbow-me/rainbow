import { FlexStyle } from 'react-native';

export type Point<T = number> = {
  x: T;
  y: T;
};

export type Offset = {
  x: number;
  y: number;
};

export type Rectangle = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Direction = 'horizontal' | 'vertical';

/**
 * @summary Split a `Rectangle` in two
 * @worklet
 */
export const splitLayout = (layout: Rectangle, axis: 'x' | 'y') => {
  'worklet';
  const { x, y, width, height } = layout;
  if (axis === 'x') {
    return [
      { x, y, width: width / 2, height },
      { x: x + width / 2, y, width: width / 2, height },
    ];
  }
  return [
    { x, y, width, height: height / 2 },
    { x, y: y + height / 2, width, height: height / 2 },
  ];
};

/**
 * @summary Checks if a `Point` is included inside a `Rectangle`
 * @worklet
 */
export const includesPoint = (layout: Rectangle, { x, y }: Point, strict?: boolean) => {
  'worklet';
  if (strict) {
    return layout.x < x && x < layout.x + layout.width && layout.y < y && y < layout.y + layout.height;
  }
  return layout.x <= x && x <= layout.x + layout.width && layout.y <= y && y <= layout.y + layout.height;
};

/**
 * @summary Checks if a `Rectangle` overlaps with another `Rectangle`
 * @worklet
 */
export const overlapsRectangle = (layout: Rectangle, other: Rectangle) => {
  'worklet';
  return (
    layout.x < other.x + other.width &&
    layout.x + layout.width > other.x &&
    layout.y < other.y + other.height &&
    layout.y + layout.height > other.y
  );
};

/**
 * @summary Checks if a `Rectange` overlaps with another `Rectangle` with a margin
 * @worklet
 */
export const overlapsRectangleBy = (layout: Rectangle, other: Rectangle, by: number) => {
  'worklet';
  return (
    layout.x < other.x + other.width - by &&
    layout.x + layout.width > other.x + by &&
    layout.y < other.y + other.height - by &&
    layout.y + layout.height > other.y + by
  );
};

/**
 * @summary Apply an offset to a layout
 * @worklet
 */
export const applyOffset = (layout: Rectangle, { x, y }: Offset): Rectangle => {
  'worklet';
  return {
    width: layout.width,
    height: layout.height,
    x: layout.x + x,
    y: layout.y + y,
  };
};

/**
 * @summary Compute a center point
 * @worklet
 */
export const centerPoint = (layout: Rectangle): Point => {
  'worklet';
  return {
    x: layout.x + layout.width / 2,
    y: layout.y + layout.height / 2,
  };
};

/**
 * @summary Compute a center axis
 * @worklet
 */
export const centerAxis = (layout: Rectangle, horizontal: boolean): number => {
  'worklet';
  return horizontal ? layout.x + layout.width / 2 : layout.y + layout.height / 2;
};

/**
 * @summary Checks if a `Rectangle` overlaps with an axis
 * @worklet
 */
export const overlapsAxis = (layout: Rectangle, axis: number, horizontal: boolean) => {
  'worklet';
  return horizontal ? layout.x < axis && layout.x + layout.width > axis : layout.y < axis && layout.y + layout.height > axis;
};

export const getDistance = (x: number, y: number): number => {
  'worklet';
  return Math.sqrt(Math.abs(x) ** 2 + Math.abs(y) ** 2);
};

export const getFlexLayoutPosition = ({
  index,
  width,
  height,
  gap,
  direction,
  size,
}: {
  index: number;
  width: number;
  height: number;
  gap: number;
  direction: FlexStyle['flexDirection'];
  size: number;
}) => {
  'worklet';
  const row = Math.floor(index / size);
  const col = index % size;

  switch (direction) {
    case 'row':
      return { x: col * (width + gap), y: row * (height + gap) };
    case 'row-reverse':
      return { x: -1 * col * (width + gap), y: row * (height + gap) };
    case 'column':
      return { x: row * (height + gap), y: col * (width + gap) };
    case 'column-reverse':
      return { x: row * (height + gap), y: -1 * col * (width + gap) };
    default:
      return { x: 0, y: 0 };
  }
};
