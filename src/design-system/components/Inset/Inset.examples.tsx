/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';
import { Example } from '../../docs/types';
import source from '../../docs/utils/source.macro';
import { Placeholder } from '../../playground/Placeholder';
import { Inset } from './Inset';

export const basicUsage: Example = {
  name: 'Basic usage',
  Example: () =>
    source(
      <Inset space="19px">
        <Placeholder height={100} />
      </Inset>
    ),
};

export const customSpace: Example = {
  name: 'Custom space',
  Example: () =>
    source(
      <Inset space={{ custom: 12 }}>
        <Placeholder height={100} />
      </Inset>
    ),
};

export const horizontalSpace: Example = {
  name: 'Horizontal space',
  Example: () =>
    source(
      <Inset horizontal="19px">
        <Placeholder height={100} />
      </Inset>
    ),
};

export const verticalSpace: Example = {
  name: 'Vertical space',
  Example: () =>
    source(
      <Inset vertical="19px">
        <Placeholder height={100} />
      </Inset>
    ),
};
