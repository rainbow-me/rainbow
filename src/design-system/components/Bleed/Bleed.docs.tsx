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
            <Placeholder />
            <Bleed horizontal="19px">
              <Placeholder />
            </Bleed>
            <Placeholder />
          </Stack>
        </Inset>
      ),
    },

    {
      name: 'Custom space',
      Example: () => (
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
    },

    {
      name: 'Horizontal',
      Example: () => (
        <Inset space="19px">
          <Stack space="19px">
            <Placeholder />
            <Bleed horizontal="19px">
              <Placeholder />
            </Bleed>
            <Placeholder />
          </Stack>
        </Inset>
      ),
    },

    {
      name: 'Vertical',
      Example: () => (
        <Inset space="19px">
          <Stack space="19px">
            <Placeholder />
            <Bleed vertical="19px">
              <Placeholder />
            </Bleed>
            <Placeholder />
          </Stack>
        </Inset>
      ),
    },

    {
      name: 'Right',
      Example: () => (
        <Inset space="19px">
          <Stack space="19px">
            <Placeholder />
            <Bleed right="19px">
              <Placeholder />
            </Bleed>
            <Placeholder />
          </Stack>
        </Inset>
      ),
    },

    {
      name: 'Left',
      Example: () => (
        <Inset space="19px">
          <Stack space="19px">
            <Placeholder />
            <Bleed left="19px">
              <Placeholder />
            </Bleed>
            <Placeholder />
          </Stack>
        </Inset>
      ),
    },

    {
      name: 'Top',
      Example: () => (
        <Inset space="19px">
          <Stack space="19px">
            <Placeholder />
            <Bleed top="19px">
              <Placeholder />
            </Bleed>
            <Placeholder />
          </Stack>
        </Inset>
      ),
    },

    {
      name: 'Bottom',
      Example: () => (
        <Inset space="19px">
          <Stack space="19px">
            <Placeholder />
            <Bleed bottom="19px">
              <Placeholder />
            </Bleed>
            <Placeholder />
          </Stack>
        </Inset>
      ),
    },

    {
      name: 'All sides',
      Example: () => (
        <Inset space="19px">
          <Stack space="19px">
            <Placeholder />
            <Bleed space="19px">
              <Placeholder />
            </Bleed>
            <Placeholder />
          </Stack>
        </Inset>
      ),
    },
  ],
};

export default docs;
