/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';
import { View } from 'react-native';
import { Docs } from '../../playground/Docs';
import { Placeholder } from '../../playground/Placeholder';
import { Text } from '../Text/Text';
import { Stack } from './Stack';

const MockDivider = () => (
  <View style={{ backgroundColor: '#999', height: 1, width: '50%' }} />
);

const docs: Docs = {
  name: 'Stack',
  category: 'Layout',
  examples: [
    {
      name: 'Basic usage',
      Example: () => (
        <Stack space="12px">
          <Placeholder />
          <Placeholder />
          <Placeholder />
        </Stack>
      ),
    },
    {
      name: 'With text',
      Example: () => (
        <Stack space="15px">
          <Text>Lorem ipsum</Text>
          <Text>Lorem ipsum</Text>
          <Text>Lorem ipsum</Text>
        </Stack>
      ),
    },
    {
      name: 'With center alignment',
      Example: () => (
        <Stack alignHorizontal="center" space="19px">
          <Placeholder width={30} />
          <Placeholder width={90} />
          <Placeholder width={60} />
        </Stack>
      ),
    },
    {
      name: 'With separators',
      Example: () => (
        <Stack separator={<MockDivider />} space="19px">
          <Placeholder />
          <Placeholder />
          <Placeholder />
        </Stack>
      ),
    },
    {
      name: 'With center alignment and dividers',
      Example: () => (
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
      Example: () => (
        <Stack alignHorizontal="right" separator={<MockDivider />} space="19px">
          <Placeholder width={30} />
          <Placeholder width={90} />
          <Placeholder width={60} />
        </Stack>
      ),
    },
    {
      name: 'With no space and separators',
      Example: () => (
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
