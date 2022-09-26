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
      <Inset space="20px">
        <Stack space="20px">
          <Placeholder />
          <Bleed horizontal="20px">
            <Placeholder />
          </Bleed>
          <Placeholder />
        </Stack>
      </Inset>
    ),
};

export const horizontal: Example = {
  name: 'Horizontal',
  Example: () =>
    source(
      <Inset space="20px">
        <Stack space="20px">
          <Placeholder />
          <Bleed horizontal="20px">
            <Placeholder />
          </Bleed>
          <Placeholder />
        </Stack>
      </Inset>
    ),
};

export const vertical: Example = {
  name: 'Vertical',
  Example: () =>
    source(
      <Inset space="20px">
        <Stack space="20px">
          <Placeholder />
          <Bleed vertical="20px">
            <Placeholder />
          </Bleed>
          <Placeholder />
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
          <Placeholder />
          <Bleed horizontal={{ custom: 17 }}>
            <Placeholder />
          </Bleed>
          <Placeholder />
        </Stack>
      </Inset>
    ),
};

export const right: Example = {
  name: 'Right',
  Example: () =>
    source(
      <Inset space="20px">
        <Stack space="20px">
          <Placeholder />
          <Bleed right="20px">
            <Placeholder />
          </Bleed>
          <Placeholder />
        </Stack>
      </Inset>
    ),
};

export const left: Example = {
  name: 'Left',
  Example: () =>
    source(
      <Inset space="20px">
        <Stack space="20px">
          <Placeholder />
          <Bleed left="20px">
            <Placeholder />
          </Bleed>
          <Placeholder />
        </Stack>
      </Inset>
    ),
};

export const top: Example = {
  name: 'Top',
  Example: () =>
    source(
      <Inset space="20px">
        <Stack space="20px">
          <Bleed top="20px">
            <Placeholder />
          </Bleed>
          <Placeholder />
          <Placeholder />
        </Stack>
      </Inset>
    ),
};

export const bottom: Example = {
  name: 'Bottom',
  Example: () =>
    source(
      <Inset space="20px">
        <Stack space="20px">
          <Placeholder />
          <Placeholder />
          <Bleed bottom="20px">
            <Placeholder />
          </Bleed>
        </Stack>
      </Inset>
    ),
};

export const allSides: Example = {
  name: 'All sides',
  Example: () =>
    source(
      <Inset space="20px">
        <Stack space="20px">
          <Placeholder />
          <Bleed space="20px">
            <Placeholder />
          </Bleed>
          <Placeholder />
        </Stack>
      </Inset>
    ),
};
