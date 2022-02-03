import React, { useMemo, useState } from 'react';
import { KeyboardArea } from 'react-native-keyboard-area';
import { useQuery } from 'react-query';
import dice from '../assets/dice.png';
import TintButton from '../components/buttons/TintButton';
import SearchInput from '../components/ens-registration/SearchInput/SearchInput';
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
  Inline,
  Inset,
  Stack,
  Text,
} from '@rainbow-me/design-system';

import { fetchRegistration } from '@rainbow-me/handlers/ens';
import {
  useDebounceString,
  useDimensions,
  useKeyboardHeight,
} from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import { colors } from '@rainbow-me/styles';
import { normalizeENS, validateENS } from '@rainbow-me/utils';

export default function RegisterEnsSheet() {
  const { height: deviceHeight } = useDimensions();
  const keyboardHeight = useKeyboardHeight();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounceString(searchQuery);

  const ensValidation = useMemo(
    () =>
      validateENS(`${debouncedSearchQuery}.eth`, { includeSubdomains: false }),
    [debouncedSearchQuery]
  );

  const { data: registration, status } = useQuery(
    ensValidation.valid && ['registration', debouncedSearchQuery],
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

  const isNameInvalid = useMemo(
    () =>
      debouncedSearchQuery.length > 2 &&
      (registration?.isRegistered || !ensValidation.valid),
    [
      debouncedSearchQuery.length,
      ensValidation.valid,
      registration?.isRegistered,
    ]
  );

  const state = useMemo(() => {
    if (isNameInvalid) {
      return 'warning';
    }
    if (isSuccess) {
      return 'success';
    }
    return undefined;
  }, [isNameInvalid, isSuccess]);

  return (
    <Box background="body" flexGrow={1}>
      <SlackSheet
        bottomInset={42}
        limitScrollViewContent
        {...(ios
          ? { height: '100%' }
          : { additionalTopPadding: true, contentHeight: deviceHeight })}
      >
        <Box flexGrow={1} paddingTop="30px">
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
            <SearchInput
              contextMenuHidden
              isLoading={isLoading}
              onChangeText={value => setSearchQuery(normalizeENS(value))}
              placeholder="Input placeholder"
              state={state}
              value={searchQuery}
            />
          </Box>
          {isNameInvalid && (
            <Inset horizontal="30px">
              <Text
                align="center"
                color="secondary50"
                size="16px"
                weight="bold"
              >
                {ensValidation.hint}
              </Text>
            </Inset>
          )}
          {isSuccess && (
            <Stack alignHorizontal="center" space="5px">
              <Columns alignHorizontal="center" space="19px">
                <Column width="1/2">
                  <Text color="secondary40" size="18px" weight="bold">
                    {registration.isRegistered ? 'Taken' : 'Available'}
                  </Text>
                </Column>
                <Column width="1/2">
                  <Text color="secondary40" size="18px" weight="bold">
                    {registration.isRegistered ? 'Taken' : 'Available'}
                  </Text>
                </Column>
              </Columns>
              <Inline wrap={false}>
                <Text color="secondary40" size="18px" weight="bold">
                  {registration.isRegistered
                    ? `Til ${registration.expiryDate}`
                    : `"Price"`}
                </Text>
              </Inline>
              {!registration.isRegistered && (
                <Text color="secondary40" size="18px" weight="bold">
                  Estimated cost?
                </Text>
              )}
            </Stack>
          )}
        </Box>
        <Box>
          {ensValidation.code === 'invalid-length' && (
            <Inline
              alignHorizontal="center"
              alignVertical="center"
              space="6px"
              wrap={false}
            >
              <Box>
                <ImgixImage source={dice} style={{ height: 20, width: 20 }} />
              </Box>
              <Text color="secondary50" size="16px" weight="bold">
                Minimum 3 characters
              </Text>
            </Inline>
          )}
          <SheetActionButtonRow>
            {isSuccess && !isNameInvalid ? (
              <SheetActionButton
                color={colors.green}
                label="Continue on 􀆊"
                onPress={() => null}
                size="big"
                weight="heavy"
              />
            ) : (
              <>
                {debouncedSearchQuery.length > 2 && (
                  <TintButton onPress={() => setSearchQuery('')}>
                    􀅉 Clear
                  </TintButton>
                )}
              </>
            )}
          </SheetActionButtonRow>
          <KeyboardArea initialHeight={keyboardHeight} isOpen />
        </Box>
      </SlackSheet>
    </Box>
  );
}
