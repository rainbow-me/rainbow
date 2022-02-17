import React, { useCallback, useMemo, useState } from 'react';
import { Keyboard } from 'react-native';
import { KeyboardArea } from 'react-native-keyboard-area';
import { useDispatch } from 'react-redux';
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
  Divider,
  Heading,
  Inline,
  Inset,
  Stack,
  Text,
} from '@rainbow-me/design-system';
import {
  useAccountSettings,
  useDebounceString,
  useENSRegistration,
  useENSRegistrationCosts,
  useKeyboardHeight,
} from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import { startRegistration } from '@rainbow-me/redux/ensRegistration';
import Routes from '@rainbow-me/routes';
import { colors } from '@rainbow-me/styles';
import { normalizeENS } from '@rainbow-me/utils';

export default function ENSSearchSheet() {
  const dispatch = useDispatch();
  const { navigate } = useNavigation();
  const keyboardHeight = useKeyboardHeight();
  const { accountAddress } = useAccountSettings();

  const topPadding = android ? 29 : 19;

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounceString(searchQuery);

  const {
    data: registrationData,
    isIdle,
    isRegistered,
    isLoading,
    isInvalid,
    isAvailable,
  } = useENSRegistration({
    name: debouncedSearchQuery,
  });

  const {
    data: registrationCostsData,
    isSuccess: registrationCostsDataIsAvailable,
  } = useENSRegistrationCosts({
    duration: 1,
    name: debouncedSearchQuery,
    rentPrice: registrationData?.rentPrice,
  });

  const state = useMemo(() => {
    if (isAvailable) return 'success';
    if (isRegistered || isInvalid) return 'warning';
    return 'rainbow';
  }, [isAvailable, isInvalid, isRegistered]);

  const handlePressContinue = useCallback(() => {
    dispatch(startRegistration(accountAddress, `${searchQuery}.eth`));
    Keyboard.dismiss();
    navigate(Routes.ENS_ASSIGN_RECORDS_SHEET);
  }, [accountAddress, dispatch, navigate, searchQuery]);

  return (
    <Box background="body" flexGrow={1} paddingTop={{ custom: topPadding }}>
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
        {isInvalid && (
          <Inset horizontal="30px">
            <Text align="center" color="secondary50" size="16px" weight="bold">
              {registrationData?.hint}
            </Text>
          </Inset>
        )}
        {(isAvailable || isRegistered) && (
          <Inset horizontal="19px">
            <Stack
              separator={
                <Inset horizontal="19px">
                  <Divider />
                </Inset>
              }
              space="19px"
            >
              <Inline alignHorizontal="justify" wrap={false}>
                <SearchResultGradientIndicator
                  isRegistered={isRegistered}
                  type="availability"
                />
                {isRegistered ? (
                  <SearchResultGradientIndicator
                    expirationDate={registrationData?.expirationDate}
                    type="expiration"
                  />
                ) : (
                  <SearchResultGradientIndicator
                    price={registrationData?.rentPrice?.perYear?.display}
                    type="price"
                  />
                )}
              </Inline>
              <Inset horizontal="19px">
                {isRegistered ? (
                  <Text color="secondary50" size="16px" weight="bold">
                    This name was last registered on{' '}
                    {registrationData?.registrationDate}
                  </Text>
                ) : (
                  <Inline>
                    {registrationCostsDataIsAvailable ? (
                      <Text color="secondary50" size="16px" weight="bold">
                        Estimated total cost of
                        <Text color="secondary80" size="16px" weight="heavy">
                          {` ${registrationCostsData?.estimatedTotalRegistrationCost?.display} `}
                        </Text>
                        with current network fees
                      </Text>
                    ) : (
                      <Text color="secondary50" size="16px" weight="bold">
                        {'Loading network fees...\n'}
                      </Text>
                    )}
                  </Inline>
                )}
              </Inset>
            </Stack>
          </Inset>
        )}
      </Box>
      <Box>
        <SheetActionButtonRow>
          {isAvailable && (
            <SheetActionButton
              color={colors.green}
              label="Continue on 􀆊"
              onPress={handlePressContinue}
              size="big"
              weight="heavy"
            />
          )}
          {(isRegistered || isInvalid) && (
            <TintButton onPress={() => setSearchQuery('')}>􀅉 Clear</TintButton>
          )}
        </SheetActionButtonRow>
        <KeyboardArea initialHeight={keyboardHeight} isOpen />
      </Box>
    </Box>
  );
}
