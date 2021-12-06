/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';
import { Docs } from '../../playground/Docs';
import { Placeholder } from '../../playground/Placeholder';
import { Inset } from '../Inset/Inset';
import { Stack } from '../Stack/Stack';
import { Bleed } from './Bleed';

const docs: Docs = {
  name: 'Bleed',
  category: 'Layout',
  examples: [
    {
      name: 'Basic usage',
      Example: () => (
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
    },

    {
      name: 'Custom space',
      Example: () => (
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
    },

    {
      name: 'Right',
      Example: () => (
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
    },

    {
      name: 'Left',
      Example: () => (
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
    },

    {
      name: 'Top',
      Example: () => (
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
    },

    {
      name: 'Bottom',
      Example: () => (
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
    },
  ],
};

export default docs;
