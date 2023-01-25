import React from 'react';
import { SheetHandle } from '../sheet';
import { Box, Text, Inset, Stack } from '@/design-system';

interface ExchangeHeaderProps {
  testID: string;
  title: string;
}

export default function ExchangeHeader({ testID, title }: ExchangeHeaderProps) {
  return (
    <Box testID={`${testID}-header`}>
      <Inset space={6}>
        <Stack alignHorizontal="center" space={10}>
          {/* @ts-expect-error - Javascript Component */}
          <SheetHandle />
          {title && (
            <Text
              color="primary (Deprecated)"
              align="center"
              size="20pt"
              weight="heavy"
            >
              {title}
            </Text>
          )}
        </Stack>
      </Inset>
    </Box>
  );
}
