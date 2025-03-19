import React from 'react';
import { Text } from '@/design-system';

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text color="label" size="17pt" weight="heavy">
      {children}
    </Text>
  );
}
