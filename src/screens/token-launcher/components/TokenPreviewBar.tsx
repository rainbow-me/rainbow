import React from 'react';
import { Box, Inline, Text } from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';

export const TOKEN_PREVIEW_BAR_HEIGHT = 56 + 16 + 8;

export function TokenPreviewBar() {
  return (
    <Box
      // paddingTop="16px"
      // paddingBottom="8px"
      paddingHorizontal="16px"
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      height={TOKEN_PREVIEW_BAR_HEIGHT}
    >
      <Inline alignVertical="center" space="12px">
        <Box backgroundColor="red" width={48} height={48} borderRadius={24}></Box>
        <Box gap={10}>
          <Inline alignVertical="center" space="8px">
            <Text color="label" size="15pt" weight="bold">
              {'$NAME'}
            </Text>
            <Box height={4} width={4} background="fillTertiary" borderRadius={2} />
            <Text color="label" size="15pt" weight="bold">
              {'$0.00'}
            </Text>
          </Inline>
          <Inline alignVertical="center" space="4px">
            <Text color="labelQuaternary" size="13pt" weight="bold">
              {'MCAP'}
            </Text>
            <Text color="labelTertiary" size="13pt" weight="bold">
              {'$0k'}
            </Text>
          </Inline>
        </Box>
      </Inline>
      <ButtonPressAnimation>
        <Box background="blue" justifyContent="center" alignItems="center" paddingHorizontal="24px" borderRadius={28} height={56}>
          <Text color="label" size="20pt" weight="heavy">
            Continue
          </Text>
        </Box>
      </ButtonPressAnimation>
    </Box>
  );
}
