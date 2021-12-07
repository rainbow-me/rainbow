/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';
import { Docs } from '../../playground/Docs';
import { Placeholder } from '../../playground/Placeholder';
import { Inset } from './Inset';

const docs: Docs = {
  name: 'Inset',
  category: 'Layout',
  examples: [
    {
      name: 'Basic usage',
      Example: () => (
        <Inset space="19px">
          <Placeholder />
        </Inset>
      ),
    },

    {
      name: 'Custom space',
      Example: () => (
        <Inset space={{ custom: 12 }}>
          <Placeholder />
        </Inset>
      ),
    },

    {
      name: 'Horizontal space',
      Example: () => (
        <Inset horizontal="19px">
          <Placeholder />
        </Inset>
      ),
    },

    {
      name: 'Vertical space',
      Example: () => (
        <Inset vertical="19px">
          <Placeholder />
        </Inset>
      ),
    },

    {
      name: 'Top space',
      Example: () => (
        <Inset top="19px">
          <Placeholder />
        </Inset>
      ),
    },

    {
      name: 'Bottom space',
      Example: () => (
        <Inset bottom="19px">
          <Placeholder />
        </Inset>
      ),
    },

    {
      name: 'Left space',
      Example: () => (
        <Inset left="19px">
          <Placeholder />
        </Inset>
      ),
    },

    {
      name: 'Right space',
      Example: () => (
        <Inset right="19px">
          <Placeholder />
        </Inset>
      ),
    },
  ],
};

export default docs;
