import React from 'react';

import { ButtonPressAnimation } from '@/components/animations';
import { Inline, Stack, Text, TextIcon } from '@/design-system';

export const GasButton = ({ accentColor }: { accentColor?: string }) => {
  return (
    <ButtonPressAnimation>
      <Stack space="12px">
        <Inline alignVertical="center" space={{ custom: 5 }}>
          <Inline alignVertical="center" space="4px">
            <TextIcon
              color={accentColor ? { custom: accentColor } : 'red'}
              height={10}
              size="icon 12px"
              textStyle={{ marginTop: -1.5 }}
              width={16}
              weight="bold"
            >
              􀙭
            </TextIcon>
            <Text color="label" size="15pt" weight="heavy">
              Fast
            </Text>
          </Inline>
          <TextIcon color="labelSecondary" height={10} size="icon 13px" weight="bold" width={12}>
            􀆏
          </TextIcon>
        </Inline>
        <Inline alignVertical="center" space="4px">
          <TextIcon color="labelQuaternary" height={10} size="icon 11px" weight="heavy" width={16}>
            􀵟
          </TextIcon>
          <Text color="labelTertiary" size="15pt" weight="bold">
            $12.28
          </Text>
        </Inline>
      </Stack>
    </ButtonPressAnimation>
  );
};

