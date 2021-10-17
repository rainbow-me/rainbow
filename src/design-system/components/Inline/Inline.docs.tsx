/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';
import { Docs } from '../../playground/Docs';
import { Placeholder } from '../../playground/Placeholder';
import { Inline } from './Inline';

const docs: Docs = {
  name: 'Inline',
  category: 'Layout',
  examples: [
    {
      name: 'Basic usage',
      example: (
        <Inline space="12dp">
          <Placeholder height={40} width={40} />
          <Placeholder height={40} width={40} />
          <Placeholder height={40} width={40} />
          <Placeholder height={40} width={40} />
          <Placeholder height={40} width={40} />
          <Placeholder height={40} width={40} />
          <Placeholder height={40} width={40} />
          <Placeholder height={40} width={40} />
          <Placeholder height={40} width={40} />
          <Placeholder height={40} width={40} />
        </Inline>
      ),
    },

    {
      name: 'Center-aligned horizontally',
      example: (
        <Inline alignHorizontal="center" space="19dp">
          <Placeholder height={40} width={40} />
          <Placeholder height={40} width={40} />
          <Placeholder height={40} width={40} />
          <Placeholder height={40} width={40} />
          <Placeholder height={40} width={40} />
          <Placeholder height={40} width={40} />
          <Placeholder height={40} width={40} />
          <Placeholder height={40} width={40} />
        </Inline>
      ),
    },

    {
      name: 'Right-aligned horizontally',
      example: (
        <Inline alignHorizontal="right" space="19dp">
          <Placeholder height={40} width={40} />
          <Placeholder height={40} width={40} />
          <Placeholder height={40} width={40} />
          <Placeholder height={40} width={40} />
          <Placeholder height={40} width={40} />
          <Placeholder height={40} width={40} />
          <Placeholder height={40} width={40} />
          <Placeholder height={40} width={40} />
        </Inline>
      ),
    },

    {
      name: 'Center-aligned vertically',
      example: (
        <Inline alignVertical="center" space="19dp">
          <Placeholder height={20} width={40} />
          <Placeholder height={40} width={40} />
          <Placeholder height={60} width={40} />
          <Placeholder height={30} width={40} />
          <Placeholder height={50} width={40} />
          <Placeholder height={20} width={40} />
          <Placeholder height={70} width={40} />
          <Placeholder height={10} width={40} />
          <Placeholder height={50} width={40} />
        </Inline>
      ),
    },

    {
      name: 'Bottom-aligned vertically',
      example: (
        <Inline alignVertical="bottom" space="19dp">
          <Placeholder height={20} width={40} />
          <Placeholder height={40} width={40} />
          <Placeholder height={60} width={40} />
          <Placeholder height={30} width={40} />
          <Placeholder height={50} width={40} />
          <Placeholder height={20} width={40} />
          <Placeholder height={70} width={40} />
          <Placeholder height={10} width={40} />
          <Placeholder height={50} width={40} />
        </Inline>
      ),
    },

    {
      name: 'Center-aligned horizontally and vertically',
      example: (
        <Inline alignHorizontal="center" alignVertical="center" space="19dp">
          <Placeholder height={20} width={40} />
          <Placeholder height={40} width={40} />
          <Placeholder height={60} width={40} />
          <Placeholder height={30} width={40} />
          <Placeholder height={50} width={40} />
          <Placeholder height={20} width={40} />
          <Placeholder height={70} width={40} />
          <Placeholder height={10} width={40} />
          <Placeholder height={50} width={40} />
        </Inline>
      ),
    },
  ],
};

export default docs;
