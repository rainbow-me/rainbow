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
          <Placeholder height={100} />
        </Inset>
      ),
    },

    {
      name: 'Horizontal space',
      Example: () => (
        <Inset horizontal="19px">
          <Placeholder height={100} />
        </Inset>
      ),
    },

    {
      name: 'Vertical space',
      Example: () => (
        <Inset vertical="19px">
          <Placeholder height={100} />
        </Inset>
      ),
    },
  ],
};

export default docs;
