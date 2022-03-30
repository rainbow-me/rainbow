import React from 'react';
import { SlackSheet } from '../components/sheet';
import { Box, Heading, Inset, Stack, Text } from '@rainbow-me/design-system';
import { useAccountENSDomains } from '@rainbow-me/hooks';

export const SelectENSSheetHeight = 300;

export default function SelectENSSheet() {
  const { data: domains, isSuccess } = useAccountENSDomains();

  return (
    <SlackSheet
      contentHeight={SelectENSSheetHeight}
      height="100%"
      scrollEnabled={false}
    >
      <Box height={{ custom: SelectENSSheetHeight }}>
        <Inset space="19px" top="10px">
          <Stack space="30px">
            <Heading align="center" size="18px">
              Select ENS Name
            </Heading>
            {domains?.map(domain => (
              <Text>{domain.name}</Text>
            ))}
          </Stack>
        </Inset>
      </Box>
    </SlackSheet>
  );
}
