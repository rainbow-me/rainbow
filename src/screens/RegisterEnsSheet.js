import React, { useState } from 'react';
import RadialGradient from 'react-native-radial-gradient';
import { useQuery } from 'react-query';
import styled from 'styled-components';
import { Input } from '../components/inputs';
import { memoFn } from '../utils/memoFn';
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

const Indicator = props => {
  if (!['availability', 'expiration', 'price'].includes(props.type)) {
    throw new Error(
      'Indicator component requires prop "type" with value equal to one of ["availability", "expiration", "price"].'
    );
  }

  let text, containerWidth, gradient, textColor;
  switch (props.type) {
    case 'availability':
      if (props.isRegistered) {
        text = '😭 Taken';
        containerWidth = 110;
        gradient = colors.gradients.transparentToLightOrange;
        textColor = colors.lightOrange;
      } else {
        text = '🥳 Available';
        containerWidth = 140;
        gradient = colors.gradients.transparentToGreen;
        textColor = colors.green;
      }
      break;
    case 'expiration':
      text = `Til ${props.expiryDate}`; // fix when we have backend
      containerWidth = 210;
      gradient = colors.gradients.transparentToLightGrey;
      textColor = colors.blueGreyDark;
      break;
    case 'price':
      text = props.price; // fix when we have backend
      containerWidth = 110;
      gradient = colors.gradients.transparentToLightGrey;
      textColor = colors.blueGreyDark;
      break;
  }

  const IndicatorContainer = styled(RadialGradient).attrs(props => ({
    center: [0, 46],
    colors: gradient,
    stops: [0, 1],
  }))`
    align-items: center;
    border-radius: 46;
    height: 40;
    justify-content: center;
    overflow: hidden;
    width: ${containerWidth};
  `;

  return (
    <IndicatorContainer>
      <Text
        color={{ custom: textColor }}
        containsEmoji={props.type === 'availability'}
        size="18px"
        weight="heavy"
      >
        {text}
      </Text>
    </IndicatorContainer>
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
        <Box paddingTop="30px" paddingHorizontal="19px">
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
                <Indicator
                  type="availability"
                  isRegistered={registration.isRegistered}
                />
                {registration.isRegistered ? (
                  <Indicator
                    type="expiration"
                    expiryDate={registration.expiryDate}
                  />
                ) : (
                  <Indicator type="price" price="$5 / Year" />
                )}
              </Row>
              <Row alignHorizontal="center">
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
