import { useFocusEffect } from '@react-navigation/core';
import lang from 'i18n-js';
import React, { useCallback, useMemo, useState } from 'react';
import { Keyboard } from 'react-native';
import { Source } from 'react-native-fast-image';
import { useDebounce } from 'use-debounce';
import dice from '../assets/dice.png';
import TintButton from '../components/buttons/TintButton';
import {
  PendingRegistrations,
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
import { ENS_DOMAIN, REGISTRATION_MODES } from '@rainbow-me/helpers/ens';
import {
  useENSRegistration,
  useENSRegistrationCosts,
  useENSRegistrationStepHandler,
  useENSSearch,
} from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import Routes from '@rainbow-me/routes';
import { colors } from '@rainbow-me/styles';
import { normalizeENS } from '@rainbow-me/utils';

export default function ENSSearchSheet() {
  const { navigate } = useNavigation();

  const topPadding = android ? 29 : 19;

  const { startRegistration, name } = useENSRegistration();

  const [searchQuery, setSearchQuery] = useState(name?.replace(ENS_DOMAIN, ''));
  const [inputValue, setInputValue] = useState(name?.replace(ENS_DOMAIN, ''));
  const [debouncedSearchQuery] = useDebounce(searchQuery, 200);

  const {
    data: registrationData,
    isIdle,
    isRegistered,
    isLoading,
    isInvalid,
    isAvailable,
  } = useENSSearch({
    name: debouncedSearchQuery,
  });

  const { step } = useENSRegistrationStepHandler();
  const {
    data: registrationCostsData,
    isSuccess: registrationCostsDataIsAvailable,
  } = useENSRegistrationCosts({
    name: debouncedSearchQuery,
    rentPrice: registrationData?.rentPrice,
    step,
    yearsDuration: 1,
  });

  const state = useMemo(() => {
    if (isAvailable) return 'success';
    if (isRegistered || isInvalid) return 'warning';
  }, [isAvailable, isInvalid, isRegistered]);

  const handlePressContinue = useCallback(() => {
    startRegistration(`${searchQuery}${ENS_DOMAIN}`, REGISTRATION_MODES.CREATE);
    Keyboard.dismiss();
    navigate(Routes.ENS_ASSIGN_RECORDS_SHEET);
  }, [navigate, searchQuery, startRegistration]);

  useFocusEffect(
    useCallback(() => {
      debouncedSearchQuery.length >= 3 &&
        startRegistration(
          `${debouncedSearchQuery}${ENS_DOMAIN}`,
          REGISTRATION_MODES.CREATE
        );
    }, [debouncedSearchQuery, startRegistration])
  );

  return (
    <Box
      background="body"
      flexGrow={1}
      paddingTop={{ custom: topPadding }}
      testID="ens-search-sheet"
    >
      <Stack space="15px">
        <Box flexGrow={1} paddingTop={{ custom: 28 }}>
          <Stack alignHorizontal="center" space={{ custom: 16 }}>
            <Heading align="center" color="primary" size="23px" weight="heavy">
              {`􀠎 ${lang.t('profiles.search.header')}`}
            </Heading>
            <Text align="center" color="secondary60" size="18px" weight="bold">
              {lang.t('profiles.search.description')}
            </Text>
          </Stack>

          <Box
            alignItems="center"
            paddingBottom="19px"
            paddingHorizontal="19px"
            paddingTop={{ custom: 37 }}
          >
            <SearchInput
              isLoading={isLoading}
              onChangeText={value => {
                setSearchQuery(normalizeENS(value));
                setInputValue(value);
              }}
              selectionColor={
                isAvailable
                  ? colors.green
                  : isRegistered
                  ? colors.yellowOrange
                  : colors.appleBlue
              }
              state={state}
              testID="ens-search-input"
              value={inputValue}
            />
          </Box>
          {isIdle && (
            <Box paddingTop="10px">
              <Inline
                alignHorizontal="center"
                alignVertical="center"
                space={{ custom: 7 }}
                wrap={false}
              >
                <Box>
                  <ImgixImage
                    source={dice as Source}
                    style={{ height: 20, top: -0.5, width: 20 }}
                  />
                </Box>
                <Text
                  align="center"
                  color="secondary50"
                  size="16px"
                  weight="bold"
                >
                  {lang.t('profiles.search.3_char_min')}
                </Text>
              </Inline>
            </Box>
          )}
          {isIdle && <PendingRegistrations />}
          {isInvalid && (
            <Inset horizontal="30px">
              <Text
                align="center"
                color="secondary50"
                size="16px"
                weight="bold"
              >
                {registrationData?.hint}
              </Text>
            </Inset>
          )}
          {(isAvailable || isRegistered) && (
            <Inset horizontal="19px">
              <Stack
                separator={
                  <Inset horizontal="19px">
                    <Divider color="divider60" />
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
                      testID="ens-registration-price"
                      type="price"
                    />
                  )}
                </Inline>
                <Inset horizontal="15px">
                  {isRegistered ? (
                    <Text color="secondary60" size="16px" weight="bold">
                      {lang.t('profiles.search.registered_on', {
                        content: registrationData?.registrationDate,
                      })}
                    </Text>
                  ) : (
                    <Inline>
                      {registrationCostsDataIsAvailable ? (
                        <Text
                          color="secondary60"
                          size="16px"
                          testID="ens-registration-fees"
                          weight="bold"
                        >
                          {lang.t('profiles.search.estimated_total_cost_1')}
                          <Text color="secondary80" size="16px" weight="heavy">
                            {` ${registrationCostsData?.estimatedTotalRegistrationCost?.display} `}
                          </Text>
                          {lang.t('profiles.search.estimated_total_cost_2')}
                        </Text>
                      ) : (
                        <Text color="secondary60" size="16px" weight="bold">
                          {`${lang.t('profiles.search.loading_fees')}\n`}
                        </Text>
                      )}
                    </Inline>
                  )}
                </Inset>
              </Stack>
            </Inset>
          )}
        </Box>
        <SheetActionButtonRow>
          {isAvailable && (
            <SheetActionButton
              color={colors.green}
              // @ts-expect-error JavaScript component
              label={lang.t('profiles.search.continue')}
              onPress={handlePressContinue}
              // @ts-expect-error JavaScript component
              size="big"
              // @ts-expect-error JavaScript component
              testID="ens-search-continue"
              weight="heavy"
            />
          )}
          {(isRegistered || isInvalid) && (
            <TintButton
              onPress={() => {
                setSearchQuery('');
                setInputValue('');
              }}
              testID="ens-search-clear-button"
            >
              {lang.t('profiles.search.clear')}
            </TintButton>
          )}
        </SheetActionButtonRow>
      </Stack>
    </Box>
  );
}
