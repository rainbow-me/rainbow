import React from 'react';
import { Example } from '../../docs/types';
import source from '../../docs/utils/source.macro';
import { Text } from '../Text/Text';
import { TextLink } from './TextLink';

export const basicUsage: Example = {
  name: 'Basic usage',
  Example: () =>
    source(
      <Text color="label" size="17pt">
        This text contains a <TextLink url="https://rainbow.me">link</TextLink>
      </Text>
    ),
};
