import { useFocusEffect } from '@react-navigation/native';
import lang from 'i18n-js';
import React, { useCallback, useMemo, useState } from 'react';
import { Keyboard } from 'react-native';
import { Source } from 'react-native-fast-image';
import { useDebounce } from 'use-debounce';
import dice from '../assets/dice.png';
import TintButton from '../components/buttons/TintButton';
import { PendingRegistrations, SearchInput, SearchResultGradientIndicator } from '../components/ens-registration';
import { SheetActionButton, SheetActionButtonRow } from '../components/sheet';
import { useNavigation } from '../navigation/Navigation';
import { Box, Heading, Inline, Inset, Separator, Stack, Text } from '@/design-system';
import { ENS_DOMAIN, REGISTRATION_MODES } from '@/helpers/ens';
import {
  useENSPendingRegistrations,
  useENSRegistration,
  useENSRegistrationCosts,
  useENSRegistrationStepHandler,
  useENSSearch,
} from '@/hooks';
import { ImgixImage } from '@/components/images';
import Routes from '@/navigation/routesNames';
import { colors } from '@/styles';
import { normalizeENS } from '@/utils';

export default function ENSSearchSheet() {
  const { navigate } = useNavigation();

  const topPadding = android ? 29 : 19;

  const { startRegistration, name } = useENSRegistration();
  const { finishRegistration } = useENSPendingRegistrations();

  const [searchQuery, setSearchQuery] = useState(name?.replace(ENS_DOMAIN, ''));
  const [inputValue, setInputValue] = useState(name?.replace(ENS_DOMAIN, ''));
  const [debouncedSearchQuery] = useDebounce(searchQuery, 200);

  const {
    data: registrationData,
    isIdle,
    isRegistered,
    isPending,
    isLoading,
    isInvalid,
    isAvailable,
  } = useENSSearch({
    name: debouncedSearchQuery,
  });

  const { step } = useENSRegistrationStepHandler();
  const { data: registrationCostsData, isSuccess: registrationCostsDataIsAvailable } = useENSRegistrationCosts({
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

  const handlePressFinish = useCallback(() => {
    finishRegistration(`${searchQuery}${ENS_DOMAIN}`);
  }, [finishRegistration, searchQuery]);

  useFocusEffect(
    useCallback(() => {
      debouncedSearchQuery.length >= 3 && startRegistration(`${debouncedSearchQuery}${ENS_DOMAIN}`, REGISTRATION_MODES.CREATE);
    }, [debouncedSearchQuery, startRegistration])
  );

  const showSearchSection = !isPending && (isAvailable || isRegistered);
  const showFinishButton = isPending && !isRegistered;
  const showContinueButton = isAvailable;
  const showClearButton = isRegistered || isInvalid;

  return (
    <Box background="body (Deprecated)" flexGrow={1} paddingTop={{ custom: topPadding }} testID="ens-search-sheet">
      <Stack space="15px (Deprecated)">
        <Box flexGrow={1} paddingTop={{ custom: 28 }}>
          <Stack alignHorizontal="center" space={{ custom: 16 }}>
            <Heading align="center" color="primary (Deprecated)" size="23px / 27px (Deprecated)" weight="heavy">
              {`􀠎 ${lang.t('profiles.search.header')}`}
            </Heading>
            <Text align="center" color="secondary60 (Deprecated)" size="18px / 27px (Deprecated)" weight="bold">
              {lang.t('profiles.search.description')}
            </Text>
          </Stack>

          <Box alignItems="center" paddingBottom="19px (Deprecated)" paddingHorizontal="19px (Deprecated)" paddingTop={{ custom: 37 }}>
            <SearchInput
              isLoading={isLoading}
              onChangeText={value => {
                setSearchQuery(normalizeENS(value));
                setInputValue(value);
              }}
              selectionColor={isAvailable ? colors.green : isRegistered ? colors.yellowOrange : colors.appleBlue}
              state={state}
              testID="ens-search-input"
              value={inputValue}
            />
          </Box>
          {isIdle && (
            <Box paddingTop="10px">
              <Inline alignHorizontal="center" alignVertical="center" space={{ custom: 7 }} wrap={false}>
                <Box>
                  <ImgixImage source={dice as Source} style={{ height: 20, top: -0.5, width: 20 }} size={30} />
                </Box>
                <Text align="center" color="secondary50 (Deprecated)" size="16px / 22px (Deprecated)" weight="bold">
                  {lang.t('profiles.search.3_char_min')}
                </Text>
              </Inline>
            </Box>
          )}
          {isIdle && <PendingRegistrations />}
          {isInvalid && (
            <Inset horizontal="30px (Deprecated)">
              <Text align="center" color="secondary50 (Deprecated)" size="16px / 22px (Deprecated)" weight="bold">
                {registrationData?.hint}
              </Text>
            </Inset>
          )}
          {isPending && (
            <Inset horizontal="30px (Deprecated)">
              <Stack space="15px (Deprecated)">
                <Text align="center" color="secondary50 (Deprecated)" size="16px / 22px (Deprecated)" weight="bold">
                  {lang.t('profiles.search.already_registering_name')}
                </Text>
              </Stack>
            </Inset>
          )}
          {showSearchSection && (
            <Inset horizontal="19px (Deprecated)">
              <Stack
                separator={
                  <Inset horizontal="19px (Deprecated)">
                    <Separator color="divider60 (Deprecated)" />
                  </Inset>
                }
                space="19px (Deprecated)"
              >
                <Inline alignHorizontal="justify" wrap={false}>
                  <SearchResultGradientIndicator isRegistered={isRegistered} type="availability" />
                  {isRegistered ? (
                    registrationData?.expirationDate ? (
                      <SearchResultGradientIndicator expirationDate={registrationData?.expirationDate} type="expiration" />
                    ) : null
                  ) : (
                    <SearchResultGradientIndicator
                      price={registrationData?.rentPrice?.perYear?.display}
                      testID="ens-registration-price"
                      type="price"
                    />
                  )}
                </Inline>
                {isRegistered ? (
                  registrationData?.registrationDate ? (
                    <Inset horizontal="15px (Deprecated)">
                      <Text color="secondary60 (Deprecated)" size="16px / 22px (Deprecated)" weight="bold">
                        {lang.t('profiles.search.registered_on', {
                          content: registrationData?.registrationDate,
                        })}
                      </Text>
                    </Inset>
                  ) : null
                ) : (
                  <Inset horizontal="15px (Deprecated)">
                    <Inline>
                      {registrationCostsDataIsAvailable ? (
                        <Text color="secondary60 (Deprecated)" size="16px / 22px (Deprecated)" testID="ens-registration-fees" weight="bold">
                          {lang.t('profiles.search.estimated_total_cost_1')}
                          <Text color="secondary80 (Deprecated)" size="16px / 22px (Deprecated)" weight="heavy">
                            {` ${registrationCostsData?.estimatedTotalRegistrationCost?.display} `}
                          </Text>
                          {lang.t('profiles.search.estimated_total_cost_2')}
                        </Text>
                      ) : (
                        <Text color="secondary60 (Deprecated)" size="16px / 22px (Deprecated)" weight="bold">
                          {`${lang.t('profiles.search.loading_fees')}\n`}
                        </Text>
                      )}
                    </Inline>
                  </Inset>
                )}
              </Stack>
            </Inset>
          )}
        </Box>
        <SheetActionButtonRow>
          {showFinishButton && (
            <SheetActionButton
              label={lang.t('profiles.search.finish')}
              onPress={handlePressFinish}
              size="big"
              testID="ens-search-continue"
              weight="heavy"
            />
          )}
          {showContinueButton && (
            <SheetActionButton
              color={colors.green}
              label={lang.t('profiles.search.continue')}
              onPress={handlePressContinue}
              size="big"
              testID="ens-search-continue"
              weight="heavy"
            />
          )}
          {showClearButton && (
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
