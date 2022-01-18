import React from 'react';
import styled from 'styled-components';
import { Input } from '../components/inputs';
import { SlackSheet } from '../components/sheet';
import { Box, Stack, Text } from '@rainbow-me/design-system';

import { useDimensions } from '@rainbow-me/hooks';

const Container = styled.View`
  flex: 1;
`;

export default function RegisterEnsSheet() {
  const { height: deviceHeight } = useDimensions();
  return (
    <Container>
      <SlackSheet
        backgroundColor="white"
        bottomInset={42}
        hideHandle
        {...(ios
          ? { height: '100%' }
          : { additionalTopPadding: true, contentHeight: deviceHeight })}
      >
        <Stack alignHorizontal="center" space="10px">
          <Text size="23px" weight="bold">
            Find your name
          </Text>
          <Text color="secondary40" size="18px" weight="bold">
            Search available profile names
          </Text>
        </Stack>

        <Box
          alignItems="center"
          paddingHorizontal="19px"
          paddingVertical="42px"
        >
          <Input placeholder="Input placeholder" />
        </Box>
      </SlackSheet>
    </Container>
  );
}
