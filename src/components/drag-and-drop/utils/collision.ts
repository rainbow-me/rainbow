import { centerAxis, centerPoint, Direction, includesPoint, overlapsAxis, type Rectangle } from './geometry';

export const doesCenterPointOverlap = (activeLayout: Rectangle, itemLayout: Rectangle) => {
  'worklet';
  const itemCenterPoint = centerPoint(itemLayout);
  return includesPoint(activeLayout, itemCenterPoint);
};

export const doesOverlapOnAxis = (activeLayout: Rectangle, itemLayout: Rectangle, direction: Direction) => {
  'worklet';
  const itemCenterAxis = centerAxis(itemLayout, direction === 'horizontal');
  return overlapsAxis(activeLayout, itemCenterAxis, direction === 'horizontal');
};

export const doesOverlapHorizontally = (activeLayout: Rectangle, itemLayout: Rectangle) => {
  'worklet';
  return doesOverlapOnAxis(activeLayout, itemLayout, 'vertical');
};

export const doesOverlapVertically = (activeLayout: Rectangle, itemLayout: Rectangle) => {
  'worklet';
  return doesOverlapOnAxis(activeLayout, itemLayout, 'horizontal');
};
