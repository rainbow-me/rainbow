import React, { useMemo, useState } from 'react';
import { KeyboardArea } from 'react-native-keyboard-area';
import dice from '../assets/dice.png';
import TintButton from '../components/buttons/TintButton';
import {
  SearchInput,
  SearchResultGradientIndicator,
} from '../components/ens-registration';
import {
  SheetActionButton,
  SheetActionButtonRow,
  SlackSheet,
} from '../components/sheet';
import {
  Box,
  Heading,
  Inline,
  Inset,
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
import { normalizeENS } from '@rainbow-me/utils';

export default function RegisterEnsSheet() {
  const { height: deviceHeight } = useDimensions();
  const keyboardHeight = useKeyboardHeight();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounceString(searchQuery);

  const {
    data,
    isIdle,
    isRegistered,
    isLoading,
    isInvalid,
    isAvailable,
  } = useENSRegistration({
    duration: 1,
    name: debouncedSearchQuery,
  });

  const state = useMemo(() => {
    if (isAvailable) return 'success';
    if (isRegistered || isInvalid) return 'warning';
    return 'rainbow';
  }, [isAvailable, isInvalid, isRegistered]);

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
            paddingBottom="24px"
            paddingHorizontal="19px"
            paddingTop="42px"
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
          {isInvalid && (
            <Inset horizontal="30px">
              <Text
                align="center"
                color="secondary50"
                size="16px"
                weight="bold"
              >
                {data?.hint}
              </Text>
            </Inset>
          )}
          {(isAvailable || isRegistered) && (
            <Inset horizontal="19px">
              <Inline alignHorizontal="justify" wrap={false}>
                <SearchResultGradientIndicator
                  isRegistered={isRegistered}
                  type="availability"
                />
                {!isAvailable ? (
                  <SearchResultGradientIndicator
                    expiryDate={data?.expirationDate}
                    type="expiration"
                  />
                ) : (
                  <SearchResultGradientIndicator
                    price={`${data?.rentPrice?.perYear?.display}  / Year`}
                    type="price"
                  />
                )}
              </Inline>
            </Inset>
          )}
        </Box>
        <Box>
          {isIdle && (
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
            {isAvailable && (
              <SheetActionButton
                color={colors.green}
                label="Continue on 􀆊"
                onPress={() => null}
                size="big"
                weight="heavy"
              />
            )}
            {(isRegistered || isInvalid) && (
              <TintButton onPress={() => setSearchQuery('')}>
                􀅉 Clear
              </TintButton>
            )}
          </SheetActionButtonRow>
          <KeyboardArea initialHeight={keyboardHeight} isOpen />
        </Box>
      </SlackSheet>
    </Box>
  );
}
