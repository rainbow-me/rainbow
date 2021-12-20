/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';
import { Docs } from '../../playground/Docs';
import { Text } from '../Text/Text';
import { TextLink } from './TextLink';

const docs: Docs = {
  name: 'TextLink',
  category: 'Content',
  examples: [
    {
      name: 'Basic usage',
      Example: () => (
        <Text>
          This text contains a{' '}
          <TextLink url="https://rainbow.me">link</TextLink>
        </Text>
      ),
    },
  ],
};

export default docs;
