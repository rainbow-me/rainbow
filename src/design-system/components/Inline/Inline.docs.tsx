/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';
import { Docs } from '../../playground/Docs';
import { PlaceHolder } from '../../playground/Placeholder';
import { Inline } from './Inline';

const docs: Docs = {
  name: 'Inline',
  examples: [
    {
      name: 'Basic usage',
      example: (
        <Inline space="19dp">
          <PlaceHolder height={40} width={40} />
          <PlaceHolder height={40} width={40} />
          <PlaceHolder height={40} width={40} />
          <PlaceHolder height={40} width={40} />
          <PlaceHolder height={40} width={40} />
          <PlaceHolder height={40} width={40} />
          <PlaceHolder height={40} width={40} />
          <PlaceHolder height={40} width={40} />
        </Inline>
      ),
    },

    {
      name: 'Center-aligned horizontally',
      example: (
        <Inline alignHorizontal="center" space="19dp">
          <PlaceHolder height={40} width={40} />
          <PlaceHolder height={40} width={40} />
          <PlaceHolder height={40} width={40} />
          <PlaceHolder height={40} width={40} />
          <PlaceHolder height={40} width={40} />
          <PlaceHolder height={40} width={40} />
          <PlaceHolder height={40} width={40} />
          <PlaceHolder height={40} width={40} />
        </Inline>
      ),
    },

    {
      name: 'Right-aligned horizontally',
      example: (
        <Inline alignHorizontal="right" space="19dp">
          <PlaceHolder height={40} width={40} />
          <PlaceHolder height={40} width={40} />
          <PlaceHolder height={40} width={40} />
          <PlaceHolder height={40} width={40} />
          <PlaceHolder height={40} width={40} />
          <PlaceHolder height={40} width={40} />
          <PlaceHolder height={40} width={40} />
          <PlaceHolder height={40} width={40} />
        </Inline>
      ),
    },

    {
      name: 'Center-aligned vertically',
      example: (
        <Inline alignVertical="center" space="19dp">
          <PlaceHolder height={20} width={40} />
          <PlaceHolder height={40} width={40} />
          <PlaceHolder height={60} width={40} />
          <PlaceHolder height={30} width={40} />
          <PlaceHolder height={50} width={40} />
          <PlaceHolder height={20} width={40} />
          <PlaceHolder height={70} width={40} />
          <PlaceHolder height={10} width={40} />
          <PlaceHolder height={50} width={40} />
        </Inline>
      ),
    },

    {
      name: 'Bottom-aligned vertically',
      example: (
        <Inline alignVertical="bottom" space="19dp">
          <PlaceHolder height={20} width={40} />
          <PlaceHolder height={40} width={40} />
          <PlaceHolder height={60} width={40} />
          <PlaceHolder height={30} width={40} />
          <PlaceHolder height={50} width={40} />
          <PlaceHolder height={20} width={40} />
          <PlaceHolder height={70} width={40} />
          <PlaceHolder height={10} width={40} />
          <PlaceHolder height={50} width={40} />
        </Inline>
      ),
    },

    {
      name: 'Center-aligned horizontally and vertically',
      example: (
        <Inline alignHorizontal="center" alignVertical="center" space="19dp">
          <PlaceHolder height={20} width={40} />
          <PlaceHolder height={40} width={40} />
          <PlaceHolder height={60} width={40} />
          <PlaceHolder height={30} width={40} />
          <PlaceHolder height={50} width={40} />
          <PlaceHolder height={20} width={40} />
          <PlaceHolder height={70} width={40} />
          <PlaceHolder height={10} width={40} />
          <PlaceHolder height={50} width={40} />
        </Inline>
      ),
    },
  ],
};

export default docs;
