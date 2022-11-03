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
        <Text color="label" size="17pt">
          Debug
        </Text>
      </DebugLayout>
    ),
};
