import React, { useState } from 'react';
import { KeyboardArea } from 'react-native-keyboard-area';
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
  Stack,
  Text,
} from '@rainbow-me/design-system';

import {
  useDebounceString,
  useDimensions,
  useENSRegistration,
  useKeyboardHeight,
} from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import { colors } from '@rainbow-me/styles';

export default function RegisterEnsSheet() {
  const { height: deviceHeight } = useDimensions();
  const keyboardHeight = useKeyboardHeight();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounceString(searchQuery);

  const {
    available,
    rentPrice,
    nameExpires,
    registrationDate,
    status,
  } = useENSRegistration({
    name: debouncedSearchQuery,
  });

  const isLoading = status === 'loading';
  const isSuccess = status === 'success';

  const state = useMemo(() => {
    if (isSuccess) {
      if (available) {
        return 'success';
      }
      return 'warning';
    }
    return undefined;
  }, [isSuccess, available]);

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
              isLoading={isLoading}
              onChangeText={setSearchQuery}
              placeholder="Input placeholder"
              state={state}
              value={searchQuery}
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
                <Column width="1">
                  <Text color="secondary40" size="18px" weight="bold">
                    {available
                      ? 'Available'
                      : `Taken since ${registrationDate}`}
                  </Text>
                </Column>
              </Columns>
              <Inline wrap={false}>
                <Text color="secondary40" size="18px" weight="bold">
                  {available ? `Price: ${rentPrice} ETH` : `Til ${nameExpires}`}
                </Text>
              </Inline>
            </Stack>
          )}
        </Box>
        <Box>
          {debouncedSearchQuery.length < 3 && (
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
            {isSuccess && debouncedSearchQuery.length > 2 && (
              <>
                {available ? (
                  <SheetActionButton
                    color={colors.green}
                    label="Continue on 􀆊"
                    onPress={() => null}
                    size="big"
                    weight="heavy"
                  />
                ) : (
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
