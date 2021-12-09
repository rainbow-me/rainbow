/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';
import { Docs } from '../../docs/types';
import source from '../../docs/utils/source.macro';
import { Text } from '../Text/Text';
import { TextLink } from './TextLink';

const docs: Docs = {
  name: 'TextLink',
  category: 'Typography',
  examples: [
    {
      name: 'Basic usage',
      Example: () =>
        source(
          <Text>
            This text contains a{' '}
            <TextLink url="https://rainbow.me">link</TextLink>
          </Text>
        ),
    },
  ],
};

export default docs;
