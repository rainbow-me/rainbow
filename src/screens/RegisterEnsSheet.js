import React, { useState } from 'react';
import { useQuery } from 'react-query';
import styled from 'styled-components';
import SearchResultIndicator from '../components/ens-registration/SearchResultIndicator';
import { Input } from '../components/inputs';
import {
  SheetActionButton,
  SheetActionButtonRow,
  SlackSheet,
} from '../components/sheet';
import { Box, Heading, Row, Stack, Text } from '@rainbow-me/design-system';

import { fetchRegistration } from '@rainbow-me/handlers/ens';
import { useDebounceString, useDimensions } from '@rainbow-me/hooks';
import { colors } from '@rainbow-me/styles';

const Container = styled.View`
  flex: 1;
`;

export default function RegisterEnsSheet() {
  const { height: deviceHeight } = useDimensions();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounceString(searchQuery);

  const { data: registration, status } = useQuery(
    searchQuery.length > 3 && ['registration', debouncedSearchQuery],
    async (_, searchQuery) => {
      const fastFormatter = timestamp => {
        const date = new Date(Number(timestamp) * 1000);
        return `${date.toDateString()}`;
      };
      const registration = await fetchRegistration(searchQuery + '.eth');
      return {
        expiryDate: fastFormatter(registration.expiryDate),
        isRegistered: registration.isRegistered,
        registrationDate: fastFormatter(registration.registrationDate),
      };
    }
  );
  const isLoading = status === 'loading';
  const isSuccess = registration && status === 'success';

  return (
    <Container>
      <SlackSheet
        backgroundColor="white"
        bottomInset={42}
        {...(ios
          ? { height: '100%' }
          : { additionalTopPadding: true, contentHeight: deviceHeight })}
      >
        <Box paddingHorizontal="19px" paddingTop="30px">
          <Stack alignHorizontal="center" space="15px">
            <Heading size="23px" weight="heavy">
              􀠎 Find your name
            </Heading>
            <Text color="secondary50" size="18px" weight="bold">
              Search available profile names
            </Text>
          </Stack>

          <Box alignItems="center" paddingVertical="42px">
            <Input
              onChangeText={setSearchQuery}
              placeholder="Input placeholder"
            />
          </Box>

          {isLoading && (
            <Text color="secondary40" size="18px" weight="bold">
              Hold a sec...
            </Text>
          )}
          {isSuccess && (
            <Stack space="5px">
              <Row alignHorizontal="justify">
                <SearchResultIndicator
                  isRegistered={registration.isRegistered}
                  type="availability"
                />
                {registration.isRegistered ? (
                  <SearchResultIndicator
                    expiryDate={registration.expiryDate}
                    type="expiration"
                  />
                ) : (
                  <SearchResultIndicator price="$5 / Year" type="price" />
                )}
              </Row>
            </Stack>
          )}
        </Box>
        {isSuccess && (
          <SheetActionButtonRow>
            {registration.isRegistered ? (
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
        )}
      </SlackSheet>
    </Container>
  );
}
