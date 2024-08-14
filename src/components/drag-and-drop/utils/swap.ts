import { centerAxis, centerPoint, includesPoint, overlapsAxis, type Rectangle } from './geometry';

export const swapByItemCenterPoint = (activeLayout: Rectangle, itemLayout: Rectangle) => {
  'worklet';
  const itemCenterPoint = centerPoint(itemLayout);
  return includesPoint(activeLayout, itemCenterPoint);
};

export const swapByItemAxis = (activeLayout: Rectangle, itemLayout: Rectangle, horizontal: boolean) => {
  'worklet';
  const itemCenterAxis = centerAxis(itemLayout, horizontal);
  return overlapsAxis(activeLayout, itemCenterAxis, horizontal);
};

export const swapByItemHorizontalAxis = (activeLayout: Rectangle, itemLayout: Rectangle) => {
  'worklet';
  const itemCenterAxis = centerAxis(itemLayout, true);
  return overlapsAxis(activeLayout, itemCenterAxis, true);
};

export const swapByItemVerticalAxis = (activeLayout: Rectangle, itemLayout: Rectangle) => {
  'worklet';
  const itemCenterAxis = centerAxis(itemLayout, false);
  return overlapsAxis(activeLayout, itemCenterAxis, false);
};
