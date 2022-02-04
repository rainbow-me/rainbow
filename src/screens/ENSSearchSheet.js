import React, { useState } from 'react';
import { KeyboardArea } from 'react-native-keyboard-area';
import dice from '../assets/dice.png';
import TintButton from '../components/buttons/TintButton';
import {
  SearchInput,
  SearchResultGradientIndicator,
} from '../components/ens-registration';
import { SheetActionButton, SheetActionButtonRow } from '../components/sheet';
import { useNavigation } from '../navigation/Navigation';
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
  useENSRegistration,
  useKeyboardHeight,
} from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import Routes from '@rainbow-me/routes';
import { colors } from '@rainbow-me/styles';

export default function RegisterEnsSheet() {
  const { navigate } = useNavigation();
  const keyboardHeight = useKeyboardHeight();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounceString(searchQuery);

  const { available, rentPrice, expirationDate, status } = useENSRegistration({
    duration: 1,
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
            isLoading={isLoading}
            onChangeText={setSearchQuery}
            placeholder="Input placeholder"
            state={state}
            value={searchQuery}
          />
        </Box>
        {isSuccess && (
          <Inset horizontal="19px">
            <Inline alignHorizontal="justify" wrap={false}>
              <SearchResultGradientIndicator
                isRegistered={!available}
                type="availability"
              />
              {!available ? (
                <SearchResultGradientIndicator
                  expiryDate={expirationDate}
                  type="expiration"
                />
              ) : (
                <SearchResultGradientIndicator
                  price={`${rentPrice?.perYear?.display} / Year`}
                  type="price"
                />
              )}
            </Inline>
          </Inset>
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
                  onPress={() => navigate(Routes.ENS_ASSIGN_RECORDS_SHEET)}
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
    </Box>
  );
}
