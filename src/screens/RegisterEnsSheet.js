import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { Input } from '../components/inputs';
import { SlackSheet } from '../components/sheet';
import { Box, Stack, Text } from '@rainbow-me/design-system';

import { debouncedFetchRegistration } from '@rainbow-me/handlers/ens';
import { useDimensions } from '@rainbow-me/hooks';

const Container = styled.View`
  flex: 1;
`;

export default function RegisterEnsSheet() {
  const [searchQuery, setSearchQuery] = useState('');
  const { height: deviceHeight } = useDimensions();
  const [currentRegistration, setCurrentRegistration] = useState({
    expiryDate: null,
    isRegistered: false,
    registrationDate: null,
  });

  const setRegistration = useCallback(registration => {
    const fastFormatter = timestamp => {
      const date = new Date(Number(timestamp) * 1000);
      return `${date.toLocaleString()}`;
    };
    setCurrentRegistration({
      expiryDate: fastFormatter(registration.expiryDate),
      isRegistered: registration.isRegistered,
      registrationDate: fastFormatter(registration.registrationDate),
    });
  }, []);

  useMemo(() => {
    debouncedFetchRegistration(
      searchQuery + '.eth',
      setRegistration,
      () => null
    );
  }, [setRegistration, searchQuery]);

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
          <Input
            onChangeText={setSearchQuery}
            placeholder="Input placeholder"
          />
        </Box>

        <Stack alignHorizontal="center" space="5px">
          <Text color="secondary40" size="18px" weight="bold">
            Registerd: {currentRegistration.isRegistered ? 'yeah' : 'not yet'}
          </Text>
          <Text color="secondary40" size="18px" weight="bold">
            Registration date: {currentRegistration.registrationDate}
          </Text>
          <Text color="secondary40" size="18px" weight="bold">
            Expiry date: {currentRegistration.expiryDate}
          </Text>
        </Stack>
      </SlackSheet>
    </Container>
  );
}
