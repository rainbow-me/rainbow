import React from 'react';
import { Text, TextShadow } from '@/design-system';

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <TextShadow blur={12} shadowOpacity={0.12}>
      <Text color="label" size="17pt" weight="heavy">
        {children}
      </Text>
    </TextShadow>
  );
}
