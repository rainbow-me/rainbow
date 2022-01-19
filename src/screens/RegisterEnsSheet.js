import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { Input } from '../components/inputs';
import {
  SheetActionButton,
  SheetActionButtonRow,
  SlackSheet,
} from '../components/sheet';
import {
  Box,
  Column,
  Columns,
  Row,
  Stack,
  Text,
} from '@rainbow-me/design-system';

import { debouncedFetchRegistration } from '@rainbow-me/handlers/ens';
import { useDimensions } from '@rainbow-me/hooks';
import { colors } from '@rainbow-me/styles';

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
      return `${date.toDateString()}`;
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
        {...(ios
          ? { height: '100%' }
          : { additionalTopPadding: true, contentHeight: deviceHeight })}
      >
        <Box paddingTop="30px">
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
            <Columns alignHorizontal="center" space="19px">
              <Column width="1/2">
                <Text color="secondary40" size="18px" weight="bold">
                  {currentRegistration.isRegistered ? 'Taken' : 'Available'}
                </Text>
              </Column>
              <Column width="1/2">
                <Text color="secondary40" size="18px" weight="bold">
                  {currentRegistration.isRegistered ? 'Taken' : 'Available'}
                </Text>
              </Column>
            </Columns>
            <Row>
              <Text color="secondary40" size="18px" weight="bold">
                {currentRegistration.isRegistered
                  ? `Til ${currentRegistration.expiryDate}`
                  : `"Price"`}
              </Text>
            </Row>
            {!currentRegistration.isRegistered && (
              <Text color="secondary40" size="18px" weight="bold">
                Estimated cost?
              </Text>
            )}
          </Stack>
        </Box>
        <SheetActionButtonRow>
          {currentRegistration.isRegistered ? (
            <SheetActionButton
              color={colors.grey}
              label="Clear"
              onPress={() => null}
              weight="heavy"
            />
          ) : (
            <SheetActionButton
              color={colors.green}
              label="Continue on"
              onPress={() => null}
              weight="heavy"
            />
          )}
        </SheetActionButtonRow>
      </SlackSheet>
    </Container>
  );
}
