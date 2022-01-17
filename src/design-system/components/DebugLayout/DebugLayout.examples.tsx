/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';
import { Example } from '../../docs/types';
import source from '../../docs/utils/source.macro';
import { Text } from '../Text/Text';
import { DebugLayout } from './DebugLayout';

export const basicUsage: Example = {
  name: 'Basic usage',
  Example: () =>
    source(
      <DebugLayout>
        <Text>Debug</Text>
      </DebugLayout>
    ),
};
