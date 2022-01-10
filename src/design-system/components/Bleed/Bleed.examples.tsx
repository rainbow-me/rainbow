/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';

import { Example } from '../../docs/types';
import source from '../../docs/utils/source.macro';
import { Placeholder } from '../../playground/Placeholder';
import { Inset } from '../Inset/Inset';
import { Stack } from '../Stack/Stack';
import { Bleed } from './Bleed';

export const basicUsage: Example = {
  name: 'Basic usage',
  Example: () =>
    source(
      <Inset space="19px">
        <Stack space="19px">
          <Placeholder height={100} />
          <Bleed horizontal="19px">
            <Placeholder height={100} />
          </Bleed>
          <Placeholder height={100} />
        </Stack>
      </Inset>
    ),
};

export const customSpace: Example = {
  name: 'Custom space',
  Example: () =>
    source(
      <Inset space={{ custom: 17 }}>
        <Stack space={{ custom: 17 }}>
          <Placeholder height={100} />
          <Bleed horizontal={{ custom: 17 }}>
            <Placeholder height={100} />
          </Bleed>
          <Placeholder height={100} />
        </Stack>
      </Inset>
    ),
};

export const right: Example = {
  name: 'Right',
  Example: () =>
    source(
      <Inset space="19px">
        <Stack space="19px">
          <Placeholder height={100} />
          <Bleed right="19px">
            <Placeholder height={100} />
          </Bleed>
          <Placeholder height={100} />
        </Stack>
      </Inset>
    ),
};

export const left: Example = {
  name: 'Left',
  Example: () =>
    source(
      <Inset space="19px">
        <Stack space="19px">
          <Placeholder height={100} />
          <Bleed left="19px">
            <Placeholder height={100} />
          </Bleed>
          <Placeholder height={100} />
        </Stack>
      </Inset>
    ),
};

export const top: Example = {
  name: 'Top',
  Example: () =>
    source(
      <Inset space="19px">
        <Stack space="19px">
          <Bleed top="19px">
            <Placeholder height={100} />
          </Bleed>
          <Placeholder height={100} />
          <Placeholder height={100} />
        </Stack>
      </Inset>
    ),
};

export const bottom: Example = {
  name: 'Bottom',
  Example: () =>
    source(
      <Inset space="19px">
        <Stack space="19px">
          <Placeholder height={100} />
          <Placeholder height={100} />
          <Bleed bottom="19px">
            <Placeholder height={100} />
          </Bleed>
        </Stack>
      </Inset>
    ),
};
