import React, { useState } from 'react';
import { useQuery } from 'react-query';
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
  Heading,
  Row,
  Stack,
  Text,
} from '@rainbow-me/design-system';

import { fetchRegistration, getENSCost } from '@rainbow-me/handlers/ens';
import { useDebounceString, useDimensions } from '@rainbow-me/hooks';
import { colors } from '@rainbow-me/styles';
import { useEth } from '@rainbow-me/utils/ethereumUtils';

const Container = styled.View`
  flex: 1;
`;

export default function RegisterEnsSheet() {
  const { height: deviceHeight } = useDimensions();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounceString(searchQuery);
  const ethAsset = useEth();

  const estimatedENSCost = useMemo(() => getENSCost(ethAsset, searchQuery, 1), [
    ethAsset,
    searchQuery,
  ]);

  const { data: registration, status } = useQuery(
    searchQuery.length > 2 && ['registration', debouncedSearchQuery],
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
        <Box paddingTop="30px">
          <Stack alignHorizontal="center" space="15px">
            <Heading size="23px" weight="heavy">
              􀠎 Find your name
            </Heading>
            <Text color="secondary50" size="18px" weight="bold">
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

          {isLoading && (
            <Text color="secondary40" size="18px" weight="bold">
              Hold a sec...
            </Text>
          )}
          {isSuccess && (
            <Stack alignHorizontal="center" space="5px">
              <Columns alignHorizontal="center" space="19px">
                <Column width="1/2">
                  <Text color="secondary40" size="18px" weight="bold">
                    {registration.isRegistered ? 'Taken' : 'Available'}
                  </Text>
                </Column>
              </Columns>
              <Row />
              <Text color="secondary40" size="18px" weight="bold">
                {!registration.isRegistered
                  ? `Estimated cost: ${estimatedENSCost.ETH} ETH ${estimatedENSCost.USD} USD`
                  : `Til ${registration.expiryDate}`}
              </Text>
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
