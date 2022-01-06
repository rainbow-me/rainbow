/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';

import { Stack } from '../components/Stack/Stack';
import { Text } from '../components/Text/Text';
import * as Docs from '../docs/components';
import { Docs as DocsType } from '../docs/types';
import source from '../docs/utils/source.macro';

const docs: DocsType = {
  meta: {
    name: 'Font weights',
    category: 'Typography',
  },
  description: (
    <Docs.Text>
      To adjust the thickness of typography components, the{' '}
      <Docs.Code>weight</Docs.Code> prop is made available.
    </Docs.Text>
  ),
  examples: [
    {
      name: 'Weights',
      Example: () =>
        source(
          <Stack space="12px">
            <Text weight="regular">Regular</Text>
            <Text weight="medium">Medium</Text>
            <Text weight="semibold">Semibold</Text>
            <Text weight="bold">Bold</Text>
            <Text weight="heavy">Heavy</Text>
          </Stack>
        ),
    },
  ],
};

export default docs;
