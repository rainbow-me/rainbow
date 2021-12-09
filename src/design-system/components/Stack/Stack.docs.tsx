/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';
import { View } from 'react-native';

import * as Docs from '../../docs/components';
import { Docs as DocsType } from '../../docs/types';
import source from '../../docs/utils/source.macro';
import { Placeholder } from '../../playground/Placeholder';
import { Inset } from '../Inset/Inset';
import { Text } from '../Text/Text';
import { Stack } from './Stack';

const MockDivider = () => (
  <View style={{ backgroundColor: '#999', height: 1, width: '50%' }} />
);

const docs: DocsType = {
  name: 'Stack',
  category: 'Layout',
  description: (
    <Stack space="24px">
      <Docs.Text>
        Arranges children <Docs.Strong>vertically</Docs.Strong> with equal
        spacing between them, plus an optional <Docs.Code>separator</Docs.Code>{' '}
        element. Items can be aligned with{' '}
        <Docs.Code>alignHorizontal</Docs.Code>.
      </Docs.Text>
      <Docs.Text>
        If there is only a single child node, no space or separators will be
        rendered.
      </Docs.Text>
    </Stack>
  ),
  examples: [
    {
      name: 'Basic usage',
      Example: () =>
        source(
          <Stack space="12px">
            <Placeholder />
            <Placeholder />
            <Placeholder />
          </Stack>
        ),
    },
    {
      name: 'Custom space',
      Example: () =>
        source(
          <Stack space={{ custom: 5 }}>
            <Placeholder />
            <Placeholder />
            <Placeholder />
          </Stack>
        ),
    },
    {
      name: 'Nested',
      description: (
        <Docs.Text>
          Stacks can be nested within each other for layouts with differing
          amounts of space between groups of content.
        </Docs.Text>
      ),
      Example: () =>
        source(
          <Inset horizontal="19px" vertical="24px">
            <Stack space="42px">
              <Stack space="12px">
                <Placeholder />
                <Placeholder />
                <Placeholder />
              </Stack>
              <Stack space="12px">
                <Placeholder />
                <Placeholder />
                <Placeholder />
              </Stack>
            </Stack>
          </Inset>
        ),
    },
    {
      name: 'With text',
      Example: () =>
        source(
          <Stack space="15px">
            <Text>Lorem ipsum</Text>
            <Text>Lorem ipsum</Text>
            <Text>Lorem ipsum</Text>
          </Stack>
        ),
    },
    {
      name: 'With center alignment',
      Example: () =>
        source(
          <Stack alignHorizontal="center" space="19px">
            <Placeholder width={30} />
            <Placeholder width={90} />
            <Placeholder width={60} />
          </Stack>
        ),
    },
    {
      name: 'With separators',
      Example: () =>
        source(
          <Stack separator={<MockDivider />} space="19px">
            <Placeholder />
            <Placeholder />
            <Placeholder />
          </Stack>
        ),
    },
    {
      name: 'With center alignment and dividers',
      Example: () =>
        source(
          <Stack
            alignHorizontal="center"
            separator={<MockDivider />}
            space="19px"
          >
            <Placeholder width={30} />
            <Placeholder width={90} />
            <Placeholder width={60} />
          </Stack>
        ),
    },
    {
      name: 'With right alignment and dividers',
      Example: () =>
        source(
          <Stack
            alignHorizontal="right"
            separator={<MockDivider />}
            space="19px"
          >
            <Placeholder width={30} />
            <Placeholder width={90} />
            <Placeholder width={60} />
          </Stack>
        ),
    },
    {
      name: 'With no space and separators',
      Example: () =>
        source(
          <Stack alignHorizontal="center" separator={<MockDivider />}>
            <Placeholder width={30} />
            <Placeholder width={90} />
            <Placeholder width={60} />
          </Stack>
        ),
    },
  ],
};

export default docs;
