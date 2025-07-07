import { createElement } from 'react';
import { Row } from '../layout';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';

export default function JellySelectorRow({ renderRow = Row, ...props }) {
  return createElement(renderRow, {
    width: DEVICE_WIDTH,
    zIndex: 11,
    ...props,
  });
}
