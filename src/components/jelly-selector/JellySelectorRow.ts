import { createElement } from 'react';
import { Row } from '../layout';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useDimensions } from '@rainbow-me/hooks';

export default function JellySelectorRow({ renderRow = Row, ...props }) {
  const { width } = useDimensions();

  return createElement(renderRow, {
    width,
    zIndex: 11,
    ...props,
  });
}
