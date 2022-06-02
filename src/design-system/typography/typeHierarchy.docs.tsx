/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';

import { Heading } from '../components/Heading/Heading';
import { Stack } from '../components/Stack/Stack';
import { Text } from '../components/Text/Text';
import * as Docs from '../docs/components';
import { Docs as DocsType } from '../docs/types';
import source from '../docs/utils/source.macro';

const docs: DocsType = {
  meta: {
    name: 'Font sizes',
    category: 'Typography',
  },
  description: (
    <Docs.Text>
      To adjust the size of typography components, the{' '}
      <Docs.Code>size</Docs.Code> prop is made available.
    </Docs.Text>
  ),
  examples: [
    {
      name: 'Heading sizes',
      Example: () =>
        source(
          <Stack space="12px">
            <Heading size="34px">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit
            </Heading>
            <Heading size="28px">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit
            </Heading>
            <Heading size="23px">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit
            </Heading>
            <Heading size="20px">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit
            </Heading>
            <Heading size="18px">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit
            </Heading>
          </Stack>
        ),
    },
    {
      name: 'Text sizes',
      Example: () =>
        source(
          <Stack space="12px">
            <Text size="23px">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit
            </Text>
            <Text size="18px">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit
            </Text>
            <Text size="16px">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit
            </Text>
            <Text size="15px">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit
            </Text>
            <Text size="14px">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit
            </Text>
            <Text size="12px">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit
            </Text>
            <Text size="11px">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit
            </Text>
          </Stack>
        ),
    },
  ],
};

export default docs;
