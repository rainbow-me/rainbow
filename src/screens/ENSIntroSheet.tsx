import MaskedView from '@react-native-masked-view/masked-view';
import { useRoute } from '@react-navigation/core';
import lang from 'i18n-js';
import React, { useCallback, useMemo } from 'react';
import { InteractionManager } from 'react-native';
import {
  ContextMenuButton,
  MenuActionConfig,
} from 'react-native-ios-context-menu';
import LinearGradient from 'react-native-linear-gradient';
import ActivityIndicator from '../components/ActivityIndicator';
import Button from '../components/buttons/Button';
import IntroMarquee from '../components/ens-registration/IntroMarquee/IntroMarquee';
import { useNavigation } from '../navigation/Navigation';
import { useTheme } from '@rainbow-me/context';
import {
  Bleed,
  Box,
  ColorModeProvider,
  Column,
  Columns,
  Divider,
  Heading,
  Inset,
  Row,
  Rows,
  Stack,
  Text,
  useColorMode,
} from '@rainbow-me/design-system';
import { REGISTRATION_MODES } from '@rainbow-me/helpers/ens';
import {
  useAccountENSDomains,
  useAccountProfile,
  useAccountSettings,
  useENSRegistration,
} from '@rainbow-me/hooks';
import Routes from '@rainbow-me/routes';
import { showActionSheetWithOptions } from '@rainbow-me/utils';

enum AnotherENSEnum {
  search = 'search',
  my_ens = 'my_ens',
}
const topPadding = android ? 29 : 19;

export default function ENSIntroSheet() {
  const { colors } = useTheme();
  const { colorMode } = useColorMode();
  const { params } = useRoute<any>();
  const { accountAddress } = useAccountSettings();
  const { data: domains, isLoading, isSuccess } = useAccountENSDomains();
  const { accountENS } = useAccountProfile();

  const { ownedDomains, primaryDomain, nonPrimaryDomains } = useMemo(() => {
    const ownedDomains = domains?.filter(
      ({ owner }) => owner?.id?.toLowerCase() === accountAddress.toLowerCase()
    );
    return {
      nonPrimaryDomains:
        ownedDomains?.filter(({ name }) => accountENS !== name) || [],
      ownedDomains,
      primaryDomain: ownedDomains?.find(({ name }) => accountENS === name),
    };
  }, [accountAddress, accountENS, domains]);

  const uniqueDomain = useMemo(() => {
    return primaryDomain
      ? primaryDomain
      : nonPrimaryDomains?.length === 1
      ? nonPrimaryDomains?.[0]
      : null;
  }, [nonPrimaryDomains, primaryDomain]);

  const { navigate } = useNavigation();
  const { startRegistration } = useENSRegistration();

  const handleNavigateToSearch = useCallback(() => {
    startRegistration('', REGISTRATION_MODES.CREATE);
    navigate(Routes.ENS_SEARCH_SHEET);
  }, [navigate, startRegistration]);

  const navigateToAssignRecords = useCallback(
    (ensName: string) => {
      startRegistration(ensName, REGISTRATION_MODES.EDIT);
      InteractionManager.runAfterInteractions(() => {
        params?.onSelectExistingName?.();
        navigate(Routes.ENS_ASSIGN_RECORDS_SHEET);
      });
    },
    [navigate, params, startRegistration]
  );

  const handleSelectUniqueDomain = useCallback(() => {
    !!uniqueDomain && navigateToAssignRecords(uniqueDomain?.name);
  }, [navigateToAssignRecords, uniqueDomain]);

  const handleSelectExistingName = useCallback(() => {
    navigate(Routes.SELECT_ENS_SHEET, {
      onSelectENS: (ensName: string) => {
        navigateToAssignRecords(ensName);
      },
    });
  }, [navigate, navigateToAssignRecords]);

  const menuConfig = useMemo(() => {
    return {
      menuItems: [
        {
          actionKey: AnotherENSEnum.my_ens,
          actionTitle: lang.t('profiles.intro.my_ens_names'),
          icon: {
            iconType: 'SYSTEM',
            iconValue: 'rectangle.stack.person.crop',
          },
        },
        {
          actionKey: AnotherENSEnum.search,
          actionTitle: lang.t('profiles.intro.search_new_ens'),
          icon: {
            iconType: 'SYSTEM',
            iconValue: 'magnifyingglass.circle',
          },
        },
      ] as MenuActionConfig[],
      menuTitle: '',
    };
  }, []);

  const onPressAndroidActions = useCallback(() => {
    const androidActions = [
      lang.t('profiles.intro.my_ens_names'),
      lang.t('profiles.intro.search_new_ens'),
    ] as const;

    showActionSheetWithOptions(
      {
        options: androidActions,
        showSeparators: true,
        title: '',
      },
      (idx: number) => {
        if (idx === 0) {
          handleSelectExistingName();
        } else if (idx === 1) {
          handleNavigateToSearch();
        }
      }
    );
  }, [handleNavigateToSearch, handleSelectExistingName]);

  const handlePressMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }) => {
      if (actionKey === AnotherENSEnum.my_ens) {
        handleSelectExistingName();
      } else if (actionKey === AnotherENSEnum.search) {
        handleNavigateToSearch();
      }
    },
    [handleNavigateToSearch, handleSelectExistingName]
  );

  return (
    <Box
      background="body"
      flexGrow={1}
      paddingTop={{ custom: topPadding }}
      testID="ens-intro-sheet"
    >
      <ColorModeProvider
        value={colorMode === 'light' ? 'lightTinted' : 'darkTinted'}
      >
        <Inset top="34px">
          <Box height="full">
            <Rows>
              <Row>
                <Stack space="42px">
                  <Stack alignHorizontal="center" space="15px">
                    <Heading size="34px">
                      {lang.t('profiles.intro.create_your')}
                    </Heading>
                    <Heading color="action" size="34px">
                      {lang.t('profiles.intro.ens_profile')}
                    </Heading>
                  </Stack>
                  <Bleed left="10px">
                    <IntroMarquee />
                  </Bleed>
                  <Divider />
                  <Inset horizontal="34px">
                    <Stack space="42px">
                      <InfoRow
                        description={lang.t(
                          'profiles.intro.wallet_address_info.description'
                        )}
                        icon="􀈠"
                        title={lang.t(
                          'profiles.intro.wallet_address_info.title'
                        )}
                      />
                      <InfoRow
                        description={lang.t(
                          'profiles.intro.portable_identity_info.description'
                        )}
                        icon="􀪽"
                        title={lang.t(
                          'profiles.intro.portable_identity_info.title'
                        )}
                      />
                      <InfoRow
                        description={lang.t(
                          'profiles.intro.stored_on_blockchain_info.description'
                        )}
                        icon="􀐙"
                        title={lang.t(
                          'profiles.intro.stored_on_blockchain_info.title'
                        )}
                      />
                    </Stack>
                  </Inset>
                </Stack>
              </Row>
              <Row height="content">
                <Inset space="24px">
                  {isLoading && (
                    <Box alignItems="center" paddingBottom="15px">
                      {/* @ts-expect-error JavaScript component */}
                      <ActivityIndicator />
                    </Box>
                  )}
                  {isSuccess && (
                    <>
                      {ownedDomains?.length === 0 ? (
                        <Button
                          backgroundColor={colors.appleBlue}
                          onPress={handleNavigateToSearch}
                          testID="ens-intro-sheet-find-your-name-button"
                          textProps={{ weight: 'heavy' }}
                        >
                          􀠎 {lang.t('profiles.intro.find_your_name')}
                        </Button>
                      ) : (
                        <Stack space="15px">
                          {uniqueDomain ? (
                            <Button
                              backgroundColor={colors.appleBlue}
                              onPress={handleSelectUniqueDomain}
                              textProps={{ weight: 'heavy' }}
                            >
                              {lang.t('profiles.intro.use_name', {
                                name: uniqueDomain?.name,
                              })}
                            </Button>
                          ) : (
                            <Button
                              backgroundColor={colors.appleBlue}
                              onPress={handleSelectExistingName}
                              textProps={{ weight: 'heavy' }}
                            >
                              {lang.t('profiles.intro.use_existing_name')}
                            </Button>
                          )}
                          {nonPrimaryDomains?.length > 0 ? (
                            <ContextMenuButton
                              menuConfig={menuConfig}
                              {...(android
                                ? { onPress: onPressAndroidActions }
                                : {})}
                              isMenuPrimaryAction
                              onPressMenuItem={handlePressMenuItem}
                              useActionSheetFallback={false}
                            >
                              <Button
                                backgroundColor={colors.transparent}
                                borderColor={colors.transparent}
                                color={colors.appleBlue}
                                textProps={{ size: 'lmedium', weight: 'heavy' }}
                              >
                                {lang.t('profiles.intro.choose_another_name')}
                              </Button>
                            </ContextMenuButton>
                          ) : (
                            <Button
                              backgroundColor={colors.transparent}
                              borderColor={colors.transparent}
                              color={colors.appleBlue}
                              onPress={handleNavigateToSearch}
                              testID="ens-intro-sheet-search-new-name-button"
                              textProps={{ size: 'lmedium', weight: 'heavy' }}
                            >
                              {lang.t('profiles.intro.search_new_name')}
                            </Button>
                          )}
                        </Stack>
                      )}
                    </>
                  )}
                </Inset>
              </Row>
            </Rows>
          </Box>
        </Inset>
      </ColorModeProvider>
    </Box>
  );
}

function InfoRow({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  const { colors } = useTheme();

  return (
    <Columns space="10px">
      <Column width="1/5">
        <MaskedView
          maskElement={
            <Box
              {...(android && {
                paddingTop: '6px',
              })}
            >
              <Heading align="center" color="action" size="30px">
                {icon}
              </Heading>
            </Box>
          }
        >
          <Box
            as={LinearGradient}
            colors={colors.gradients.appleBlueTintToAppleBlue}
            end={{ x: 0.5, y: 1 }}
            height={{ custom: android ? 50 : 40 }}
            marginTop="-10px"
            start={{ x: 0, y: 0 }}
            width="full"
          />
        </MaskedView>
      </Column>
      <Bleed top="4px">
        <Stack space="12px">
          <Text weight="bold">{title}</Text>
          <Text color="secondary60" size="14px" weight="medium">
            {description}
          </Text>
        </Stack>
      </Bleed>
    </Columns>
  );
}
