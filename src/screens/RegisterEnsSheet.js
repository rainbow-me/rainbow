import React, { useState } from 'react';
import RadialGradient from 'react-native-radial-gradient';
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

import { fetchRegistration } from '@rainbow-me/handlers/ens';
import { useDebounceString, useDimensions } from '@rainbow-me/hooks';
import { colors } from '@rainbow-me/styles';

const Container = styled.View`
  flex: 1;
`;

const AvailabilityIndicator = props => {
  if (props.isRegistered == null) {
    throw new Error(
      'AvailabilityIndicator component requires boolean prop "isRegistered".'
    );
  }

  let text, containerWidth, bgColor, textColor;

  if (props.isRegistered) {
    text = '😭 Taken';
    containerWidth = 110;
    bgColor = 'rgba(255, 166, 77, 0.06)';
    textColor = 'rgba(255, 166, 77, 1)';
  } else {
    text = '🥳 Available';
    containerWidth = 140;
    bgColor = 'rgba(44, 204, 0, 0.06)';
    textColor = 'rgba(44, 204, 0, 1)';
  }

  return (
    <RadialGradient
      center={[0, 46]}
      colors={['transparent', bgColor]}
      stops={[0, 1]}
      style={{
        alignItems: 'center',
        borderRadius: 46,
        height: 40,
        justifyContent: 'center',
        left: 19,
        overflow: 'hidden',
        width: containerWidth,
      }}
    >
      <Text
        color={{ custom: textColor }}
        containsEmoji
        size="18px"
        weight="heavy"
      >
        {text}
      </Text>
    </RadialGradient>
  );
};

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
                  <AvailabilityIndicator
                    isRegistered={registration.isRegistered}
                  />
                </Column>
                <Column width="1/2">
                  <Text color="secondary40" size="18px" weight="bold">
                    {registration.isRegistered ? 'Taken' : 'Available'}
                  </Text>
                </Column>
              </Columns>
              <Row>
                <Text color="secondary40" size="18px" weight="bold">
                  {registration.isRegistered
                    ? `Til ${registration.expiryDate}`
                    : `"Price"`}
                </Text>
              </Row>
              {!registration.isRegistered && (
                <Text color="secondary40" size="18px" weight="bold">
                  Estimated cost?
                </Text>
              )}
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
