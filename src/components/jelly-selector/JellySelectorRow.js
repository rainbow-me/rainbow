import { createElement } from 'react';
import { Row } from '../layout';
import { useDimensions } from '@/hooks';

export default function JellySelectorRow({ renderRow = Row, ...props }) {
  const { width } = useDimensions();

  return createElement(renderRow, {
    width,
    zIndex: 11,
    ...props,
  });
}
