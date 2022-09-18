import React from 'react';
import { Example } from '../../docs/types';
import source from '../../docs/utils/source.macro';
import { Placeholder } from '../../playground/Placeholder';
import { Inset } from './Inset';

export const basicUsage: Example = {
  name: 'Basic usage',
  Example: () =>
    source(
      <Inset space="20px">
        <Placeholder />
      </Inset>
    ),
};

export const customSpace: Example = {
  name: 'Custom space',
  Example: () =>
    source(
      <Inset space={{ custom: 12 }}>
        <Placeholder />
      </Inset>
    ),
};

export const horizontalSpace: Example = {
  name: 'Horizontal space',
  Example: () =>
    source(
      <Inset horizontal="20px">
        <Placeholder />
      </Inset>
    ),
};

export const verticalSpace: Example = {
  name: 'Vertical space',
  Example: () =>
    source(
      <Inset vertical="20px">
        <Placeholder />
      </Inset>
    ),
};

export const topSpace: Example = {
  name: 'Top space',
  Example: () =>
    source(
      <Inset top="20px">
        <Placeholder />
      </Inset>
    ),
};

export const bottomSpace: Example = {
  name: 'Bottom space',
  Example: () =>
    source(
      <Inset bottom="20px">
        <Placeholder />
      </Inset>
    ),
};

export const leftSpace: Example = {
  name: 'Left space',
  Example: () =>
    source(
      <Inset left="20px">
        <Placeholder />
      </Inset>
    ),
};

export const rightSpace: Example = {
  name: 'Right space',
  Example: () =>
    source(
      <Inset right="20px">
        <Placeholder />
      </Inset>
    ),
};
