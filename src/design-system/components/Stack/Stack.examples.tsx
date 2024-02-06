import React from 'react';
import { View } from 'react-native';

import { Example } from '../../docs/types';
import source from '../../docs/utils/source.macro';
import { Placeholder } from '../../playground/Placeholder';
import { Inset } from '../Inset/Inset';
import { Text } from '../Text/Text';
import { Stack } from './Stack';

const MockDivider = () => <View style={{ backgroundColor: '#999', height: 1, width: '50%' }} />;

export const basicUsage = {
  name: 'Basic usage',
  Example: () =>
    source(
      <Stack space="12px">
        <Placeholder />
        <Placeholder />
        <Placeholder />
      </Stack>
    ),
};

export const customSpace = {
  name: 'Custom space',
  Example: () =>
    source(
      <Stack space={{ custom: 5 }}>
        <Placeholder />
        <Placeholder />
        <Placeholder />
      </Stack>
    ),
};

export const nested: Example = {
  name: 'Nested',
  Example: () =>
    source(
      <Inset horizontal="20px" vertical="24px">
        <Stack space="44px">
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
};
export const withText: Example = {
  name: 'With text',
  Example: () =>
    source(
      <Stack space="16px">
        <Text color="label" size="17pt">
          Lorem ipsum
        </Text>
        <Text color="label" size="17pt">
          Lorem ipsum
        </Text>
        <Text color="label" size="17pt">
          Lorem ipsum
        </Text>
      </Stack>
    ),
};

export const withCenterAlignment: Example = {
  name: 'With center alignment',
  Example: () =>
    source(
      <Stack alignHorizontal="center" space="20px">
        <Placeholder width={30} />
        <Placeholder width={90} />
        <Placeholder width={60} />
      </Stack>
    ),
};

export const withSeparators: Example = {
  name: 'With separators',
  Example: () =>
    source(
      <Stack separator={<MockDivider />} space="20px">
        <Placeholder />
        <Placeholder />
        <Placeholder />
      </Stack>
    ),
};

export const withCenterAlignmentAndDividers: Example = {
  name: 'With center alignment and dividers',
  Example: () =>
    source(
      <Stack alignHorizontal="center" separator={<MockDivider />} space="20px">
        <Placeholder width={30} />
        <Placeholder width={90} />
        <Placeholder width={60} />
      </Stack>
    ),
};

export const withRightAlignmentAndDividers: Example = {
  name: 'With right alignment and dividers',
  Example: () =>
    source(
      <Stack alignHorizontal="right" separator={<MockDivider />} space="20px">
        <Placeholder width={30} />
        <Placeholder width={90} />
        <Placeholder width={60} />
      </Stack>
    ),
};

export const withNoSpaceAndSeparators: Example = {
  name: 'With no space and separators',
  Example: () =>
    source(
      <Stack alignHorizontal="center" separator={<MockDivider />}>
        <Placeholder width={30} />
        <Placeholder width={90} />
        <Placeholder width={60} />
      </Stack>
    ),
};
