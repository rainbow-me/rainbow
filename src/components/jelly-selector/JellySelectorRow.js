import { createElement } from 'react';
import { useDimensions } from '../../hooks';
import { Row } from '../layout';

export default function JellySelectorRow({ renderRow = Row, ...props }) {
  const { width } = useDimensions();

  return createElement(renderRow, {
    width,
    zIndex: 11,
    ...props,
  });
}
