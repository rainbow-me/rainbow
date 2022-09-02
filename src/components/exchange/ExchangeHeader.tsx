import React from 'react';
import { SheetHandle } from '../sheet';
import { Box, Heading, Inset, Stack } from '@/design-system';

interface ExchangeHeaderProps {
  testID: string;
  title: string;
}

export default function ExchangeHeader({ testID, title }: ExchangeHeaderProps) {
  return (
    <Box testID={`${testID}-header`}>
      <Inset space="6px">
        <Stack alignHorizontal="center" space="10px">
          {/* @ts-expect-error - Javascript Component */}
          <SheetHandle />
          {title && (
            <Heading align="center" size="18px" weight="heavy">
              {title}
            </Heading>
          )}
        </Stack>
      </Inset>
    </Box>
  );
}
