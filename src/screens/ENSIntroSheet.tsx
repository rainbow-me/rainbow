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
import IntroMarquee from '../components/ens-registration/IntroMarquee/IntroMarquee';
import { SheetActionButton } from '../components/sheet';
import { useNavigation } from '../navigation/Navigation';
import {
  Bleed,
  Box,
  Column,
  Columns,
  Divider,
  Heading,
  Inset,
  Row,
  Rows,
  Stack,
  Text,
} from '@rainbow-me/design-system';
import { REGISTRATION_MODES } from '@rainbow-me/helpers/ens';
import {
  useAccountENSDomains,
  useAccountProfile,
  useAccountSettings,
  useDimensions,
  useENSRegistration,
} from '@rainbow-me/hooks';
import Routes from '@rainbow-me/routes';
import { useTheme } from '@rainbow-me/theme';
import { showActionSheetWithOptions } from '@rainbow-me/utils';

enum AnotherENSEnum {
  search = 'search',
  my_ens = 'my_ens',
}
const topPadding = android ? 29 : 19;

const minHeight = 740;

export default function ENSIntroSheet() {
  const { width: deviceWidth, height: deviceHeight } = useDimensions();
  const { colors } = useTheme();
  const { params } = useRoute<any>();
  const { accountAddress } = useAccountSettings();
  const { data: domains, isLoading, isSuccess } = useAccountENSDomains();
  const { accountENS } = useAccountProfile();

  // We are not using `isSmallPhone` from `useDimensions` here as we
  // want to explicitly set a min height.
  const isSmallPhone = deviceHeight < minHeight;

  const contentHeight = params?.contentHeight;
  const contentWidth = Math.min(deviceWidth - 72, 300);

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
    params?.onSearchForNewName?.();
    InteractionManager.runAfterInteractions(() => {
      startRegistration('', REGISTRATION_MODES.CREATE);
      navigate(Routes.ENS_SEARCH_SHEET);
    });
  }, [navigate, params, startRegistration]);

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
            iconValue: 'rectangle.stack.badge.person.crop',
          },
        },
        {
          actionKey: AnotherENSEnum.search,
          actionTitle: lang.t('profiles.intro.search_new_ens'),
          icon: {
            iconType: 'SYSTEM',
            iconValue: 'magnifyingglass',
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
      paddingTop={{ custom: topPadding }}
      style={{ height: contentHeight }}
      testID="ens-intro-sheet"
    >
      <Inset top={isSmallPhone ? '15px' : '36px'}>
        <Box height="full">
          <Rows>
            <Row>
              <Stack space={{ custom: isSmallPhone ? 30 : 38 }}>
                <Stack alignHorizontal="center" space={{ custom: 17 }}>
                  <Heading align="center" size="34px">
                    {lang.t('profiles.intro.create_your')}
                  </Heading>
                  <Heading align="center" color="action" size="34px">
                    {lang.t('profiles.intro.ens_profile')}
                  </Heading>
                </Stack>
                <Stack space={{ custom: isSmallPhone ? 30 : 40 }}>
                  <Bleed left="10px">
                    <IntroMarquee />
                  </Bleed>
                  <Inset horizontal="34px">
                    <Divider color="divider60" />
                  </Inset>
                </Stack>
                <Stack alignHorizontal="center">
                  <Box width={{ custom: contentWidth }}>
                    <Inset top="6px">
                      <Stack space={isSmallPhone ? '30px' : '36px'}>
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
                  </Box>
                </Stack>
              </Stack>
            </Row>
            <Row height="content">
              <Box paddingBottom="4px">
                <Inset
                  space="19px"
                  {...(isSmallPhone ? { bottom: '8px' } : {})}
                >
                  {isLoading && (
                    <Box alignItems="center" paddingBottom="15px">
                      {/* @ts-expect-error JavaScript component */}
                      <ActivityIndicator />
                    </Box>
                  )}
                  {isSuccess && (
                    <>
                      {ownedDomains?.length === 0 ? (
                        <SheetActionButton
                          color={colors.appleBlue}
                          // @ts-expect-error JavaScript component
                          label={'􀠎 ' + lang.t('profiles.intro.find_your_name')}
                          lightShadows
                          marginBottom={15}
                          onPress={handleNavigateToSearch}
                          // @ts-expect-error
                          testID="ens-intro-sheet-find-your-name-button"
                          weight="heavy"
                        />
                      ) : (
                        <Stack space="12px">
                          {uniqueDomain ? (
                            <SheetActionButton
                              color={colors.appleBlue}
                              // @ts-expect-error JavaScript component
                              label={lang.t('profiles.intro.use_name', {
                                name: uniqueDomain?.name,
                              })}
                              lightShadows
                              onPress={handleSelectUniqueDomain}
                              weight="heavy"
                            />
                          ) : (
                            <SheetActionButton
                              color={colors.appleBlue}
                              // @ts-expect-error JavaScript component
                              label={lang.t('profiles.intro.use_existing_name')}
                              lightShadows
                              onPress={handleSelectExistingName}
                              weight="heavy"
                            />
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
                              <SheetActionButton
                                color={colors.transparent}
                                isTransparent
                                // @ts-expect-error JavaScript component
                                label={lang.t(
                                  'profiles.intro.choose_another_name'
                                )}
                                textColor={colors.appleBlue}
                                textSize="lmedium"
                                weight="bold"
                              />
                            </ContextMenuButton>
                          ) : (
                            <SheetActionButton
                              color={colors.transparent}
                              isTransparent
                              // @ts-expect-error JavaScript component
                              label={lang.t('profiles.intro.search_new_name')}
                              onPress={handleNavigateToSearch}
                              // @ts-expect-error
                              testID="ens-intro-sheet-search-new-name-button"
                              textColor={colors.appleBlue}
                              textSize="lmedium"
                              weight="bold"
                            />
                          )}
                        </Stack>
                      )}
                    </>
                  )}
                </Inset>
              </Box>
            </Row>
          </Rows>
        </Box>
      </Inset>
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
    <Columns space={{ custom: 13 }}>
      <Column width="content">
        <MaskedView
          maskElement={
            <Box
              {...(android && {
                paddingTop: '6px',
              })}
            >
              <Heading align="center" color="action" size="28px" weight="bold">
                {icon}
              </Heading>
            </Box>
          }
          style={{ width: 42 }}
        >
          <Box
            as={LinearGradient}
            colors={colors.gradients.appleBlueTintToAppleBlue}
            end={{ x: 0.5, y: 1 }}
            height={{ custom: 50 }}
            marginTop="-10px"
            start={{ x: 0, y: 0 }}
            width="full"
          />
        </MaskedView>
      </Column>
      <Bleed top="3px">
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
