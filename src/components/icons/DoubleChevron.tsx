import React from 'react';
import { RowWithMargins } from '../layout';
import { Bleed } from '@/design-system/components/Bleed/Bleed';
import { Cover } from '@/design-system/components/Cover/Cover';
import { Text } from '@/design-system/components/Text/Text';
const DoubleChevron = () => (
  <Cover alignHorizontal="center" alignVertical="center">
    <RowWithMargins>
      <Text color="secondary60 (Deprecated)" size="16px / 22px (Deprecated)" weight="semibold">
        􀯻
      </Text>
      <Bleed left="6px">
        <Text color="secondary40 (Deprecated)" size="16px / 22px (Deprecated)" weight="semibold">
          􀯻
        </Text>
      </Bleed>
    </RowWithMargins>
  </Cover>
);

export default DoubleChevron;
