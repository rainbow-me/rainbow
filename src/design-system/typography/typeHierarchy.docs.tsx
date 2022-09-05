import React from 'react';

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
      name: 'Text sizes',
      Example: () =>
        source(
          <Stack space="34px">
            <Text size="44pt">
              Lorem ipsum dolor sit amet,
              <br />
              consectetur adipiscing elit
            </Text>
            <Text size="34pt">
              Lorem ipsum dolor sit amet,
              <br />
              consectetur adipiscing elit
            </Text>
            <Text size="30pt">
              Lorem ipsum dolor sit amet,
              <br />
              consectetur adipiscing elit
            </Text>
            <Text size="26pt">
              Lorem ipsum dolor sit amet,
              <br />
              consectetur adipiscing elit
            </Text>
            <Text size="22pt">
              Lorem ipsum dolor sit amet,
              <br />
              consectetur adipiscing elit
            </Text>
            <Text size="20pt">
              Lorem ipsum dolor sit amet,
              <br />
              consectetur adipiscing elit
            </Text>
            <Text size="20pt / 135%">
              Lorem ipsum dolor sit amet,
              <br />
              consectetur adipiscing elit
            </Text>
            <Text size="20pt / 150%">
              Lorem ipsum dolor sit amet,
              <br />
              consectetur adipiscing elit
            </Text>
            <Text size="17pt">
              Lorem ipsum dolor sit amet,
              <br />
              consectetur adipiscing elit
            </Text>
            <Text size="17pt / 135%">
              Lorem ipsum dolor sit amet,
              <br />
              consectetur adipiscing elit
            </Text>
            <Text size="17pt / 150%">
              Lorem ipsum dolor sit amet,
              <br />
              consectetur adipiscing elit
            </Text>
            <Text size="15pt">
              Lorem ipsum dolor sit amet,
              <br />
              consectetur adipiscing elit
            </Text>
            <Text size="15pt / 135%">
              Lorem ipsum dolor sit amet,
              <br />
              consectetur adipiscing elit
            </Text>
            <Text size="15pt / 150%">
              Lorem ipsum dolor sit amet,
              <br />
              consectetur adipiscing elit
            </Text>
            <Text size="13pt">
              Lorem ipsum dolor sit amet,
              <br />
              consectetur adipiscing elit
            </Text>
            <Text size="13pt / 135%">
              Lorem ipsum dolor sit amet,
              <br />
              consectetur adipiscing elit
            </Text>
            <Text size="13pt / 150%">
              Lorem ipsum dolor sit amet,
              <br />
              consectetur adipiscing elit
            </Text>
            <Text size="12pt">
              Lorem ipsum dolor sit amet,
              <br />
              consectetur adipiscing elit
            </Text>
            <Text size="11pt">
              Lorem ipsum dolor sit amet,
              <br />
              consectetur adipiscing elit
            </Text>
          </Stack>
        ),
    },
  ],
};

export default docs;
