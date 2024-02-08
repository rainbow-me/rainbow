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
      To adjust the thickness of typography components, the <Docs.Code>weight</Docs.Code> prop is made available.
    </Docs.Text>
  ),
  examples: [
    {
      name: 'Weights',
      Example: () =>
        source(
          <Stack space="12px">
            <Text color="label" size="17pt" weight="regular">
              Regular
            </Text>
            <Text color="label" size="17pt" weight="medium">
              Medium
            </Text>
            <Text color="label" size="17pt" weight="semibold">
              Semibold
            </Text>
            <Text color="label" size="17pt" weight="bold">
              Bold
            </Text>
            <Text color="label" size="17pt" weight="heavy">
              Heavy
            </Text>
          </Stack>
        ),
    },
  ],
};

export default docs;
