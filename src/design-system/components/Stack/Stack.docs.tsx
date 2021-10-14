/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';
import { View } from 'react-native';
import { Docs } from '../../playground/Docs';
import { Guide } from '../../playground/Guide';
import { Placeholder } from '../../playground/Placeholder';
import { Text } from '../Text/Text';
import { Stack } from './Stack';

const MockDivider = () => (
  <View style={{ backgroundColor: '#999', height: 1, width: '50%' }} />
);

const docs: Docs = {
  name: 'Stack',
  examples: [
    {
      name: 'Basic usage',
      example: (
        <Stack space="12dp">
          <Placeholder />
          <Placeholder />
          <Placeholder />
        </Stack>
      ),
    },
    {
      name: 'With text',
      example: (
        <View>
          <Guide />
          <Stack space="19dp">
            <Text>Lorem ipsum</Text>
            <Text>Lorem ipsum</Text>
            <Text>Lorem ipsum</Text>
          </Stack>
          <Guide />
        </View>
      ),
    },
    {
      name: 'With center alignment',
      example: (
        <Stack alignHorizontal="center" space="19dp">
          <Placeholder width={30} />
          <Placeholder width={90} />
          <Placeholder width={60} />
        </Stack>
      ),
    },
    {
      name: 'With dividers',
      example: (
        <Stack divider={<MockDivider />} space="19dp">
          <Placeholder />
          <Placeholder />
          <Placeholder />
        </Stack>
      ),
    },
    {
      name: 'With center alignment and dividers',
      example: (
        <Stack alignHorizontal="center" divider={<MockDivider />} space="19dp">
          <Placeholder width={30} />
          <Placeholder width={90} />
          <Placeholder width={60} />
        </Stack>
      ),
    },
    {
      name: 'With right alignment and dividers',
      example: (
        <Stack alignHorizontal="right" divider={<MockDivider />} space="19dp">
          <Placeholder width={30} />
          <Placeholder width={90} />
          <Placeholder width={60} />
        </Stack>
      ),
    },
  ],
};

export default docs;
