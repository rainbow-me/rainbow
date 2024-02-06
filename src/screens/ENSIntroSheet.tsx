import MaskedView from '@react-native-masked-view/masked-view';
import { useRoute } from '@react-navigation/native';
import { IS_TESTING } from 'react-native-dotenv';
import lang from 'i18n-js';
import React, { useCallback, useMemo } from 'react';
import { InteractionManager, View } from 'react-native';
import { MenuActionConfig } from 'react-native-ios-context-menu';
import LinearGradient from 'react-native-linear-gradient';
import ActivityIndicator from '../components/ActivityIndicator';
import IntroMarquee from '../components/ens-registration/IntroMarquee/IntroMarquee';
import { SheetActionButton } from '../components/sheet';
import { useNavigation } from '../navigation/Navigation';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { abbreviateEnsForDisplay } from '@/utils/abbreviations';
import { Bleed, Box, Column, Columns, Heading, Inset, Row, Rows, Separator, Stack, Text } from '@/design-system';
import { REGISTRATION_MODES } from '@/helpers/ens';
import { useAccountENSDomains, useDimensions, useENSAvatar, useENSRecords, useENSRegistration } from '@/hooks';
import Routes from '@/navigation/routesNames';
import { useTheme } from '@/theme';
import { IS_ANDROID } from '@/env';
import ContextMenu from '@/components/context-menu/ContextMenu.android';

enum AnotherENSEnum {
  search = 'search',
  my_ens = 'my_ens',
}

const topPadding = android ? 29 : 19;

const minHeight = 740;

type ContextMenuRendererProps = {
  children: React.ReactNode;
  handleSelectExistingName: () => void;
  handleNavigateToSearch: () => void;
};

const ContextMenuRenderer = ({ children, handleSelectExistingName, handleNavigateToSearch }: ContextMenuRendererProps) => {
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

  const handlePressMenuItem = useCallback(
    // @ts-expect-error ContextMenu is an untyped JS component and can't type its onPress handler properly
    ({ nativeEvent: { actionKey } }) => {
      if (actionKey === AnotherENSEnum.my_ens) {
        handleSelectExistingName();
      } else if (actionKey === AnotherENSEnum.search) {
        handleNavigateToSearch();
      }
    },
    [handleNavigateToSearch, handleSelectExistingName]
  );

  const handlePressActionSheet = useCallback(
    (buttonIndex: number) => {
      switch (buttonIndex) {
        case 0:
          handleSelectExistingName();
          break;
        case 1:
          handleNavigateToSearch();
          break;
      }
    },
    [handleNavigateToSearch, handleSelectExistingName]
  );

  if (IS_ANDROID) {
    return (
      <ContextMenu
        activeOpacity={0}
        cancelButtonIndex={menuConfig.menuItems.length - 1}
        dynamicOptions={undefined}
        onPressActionSheet={handlePressActionSheet}
        options={menuConfig.menuItems.map(i => i.actionTitle)}
      >
        <View>{children}</View>
      </ContextMenu>
    );
  }

  return (
    <ContextMenuButton menuConfig={menuConfig} onPressMenuItem={handlePressMenuItem} useActionSheetFallback={false}>
      {children}
    </ContextMenuButton>
  );
};

export default function ENSIntroSheet() {
  const { width: deviceWidth, height: deviceHeight } = useDimensions();
  const { colors } = useTheme();
  const { params } = useRoute<any>();

  const { controlledDomains, isLoading, isFetched, nonPrimaryDomains, uniqueDomain } = useAccountENSDomains();
  const { data: ensRecords } = useENSRecords(uniqueDomain?.name || '', {
    enabled: Boolean(uniqueDomain?.name),
  });
  const { data: ensAvatar } = useENSAvatar(uniqueDomain?.name || '', {
    enabled: Boolean(uniqueDomain?.name),
  });

  // We are not using `isSmallPhone` from `useDimensions` here as we
  // want to explicitly set a min height.
  const isSmallPhone = deviceHeight < minHeight;

  const contentHeight = params?.contentHeight;
  const contentWidth = Math.min(deviceWidth - 72, 300);

  const profileExists = useMemo(
    () =>
      ensRecords?.contenthash ||
      Object.keys(ensRecords?.coinAddresses || {}).length > 1 ||
      ensAvatar?.imageUrl ||
      Object.keys(ensRecords?.records || {}).length > 0,
    [ensAvatar?.imageUrl, ensRecords?.coinAddresses, ensRecords?.contenthash, ensRecords?.records]
  );

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
    if (uniqueDomain?.name) {
      navigateToAssignRecords(uniqueDomain?.name);
    }
  }, [navigateToAssignRecords, uniqueDomain]);

  const handleSelectExistingName = useCallback(() => {
    navigate(Routes.SELECT_ENS_SHEET, {
      onSelectENS: (ensName: string) => {
        navigateToAssignRecords(ensName);
      },
    });
  }, [navigate, navigateToAssignRecords]);

  return (
    <Box background="body (Deprecated)" paddingTop={{ custom: topPadding }} style={{ height: contentHeight }} testID="ens-intro-sheet">
      <Inset top={isSmallPhone ? '15px (Deprecated)' : '36px'}>
        <Box height="full">
          <Rows>
            <Row>
              <Stack space={{ custom: isSmallPhone ? 30 : 38 }}>
                <Stack alignHorizontal="center" space={{ custom: 17 }}>
                  <Heading align="center" color="primary (Deprecated)" size="34px / 41px (Deprecated)" weight="heavy">
                    {lang.t('profiles.intro.create_your')}
                  </Heading>
                  <Heading align="center" color="action (Deprecated)" size="34px / 41px (Deprecated)" weight="heavy">
                    {lang.t('profiles.intro.ens_profile')}
                  </Heading>
                </Stack>
                <Stack space={{ custom: isSmallPhone ? 30 : 40 }}>
                  <Bleed left="10px">{IS_TESTING !== 'true' && <IntroMarquee isSmallPhone={isSmallPhone} />}</Bleed>
                  <Inset horizontal="34px (Deprecated)">
                    <Separator color="divider60 (Deprecated)" />
                  </Inset>
                </Stack>
                <Stack alignHorizontal="center">
                  <Box width={{ custom: contentWidth }}>
                    <Inset top="6px">
                      <Stack space={isSmallPhone ? '24px' : '36px'}>
                        <InfoRow
                          description={lang.t('profiles.intro.wallet_address_info.description')}
                          icon="􀈠"
                          title={lang.t('profiles.intro.wallet_address_info.title')}
                        />
                        <InfoRow
                          description={lang.t('profiles.intro.portable_identity_info.description')}
                          icon="􀪽"
                          title={lang.t('profiles.intro.portable_identity_info.title')}
                        />
                        <InfoRow
                          description={lang.t('profiles.intro.stored_on_blockchain_info.description')}
                          icon="􀐙"
                          title={lang.t('profiles.intro.stored_on_blockchain_info.title')}
                        />
                      </Stack>
                    </Inset>
                  </Box>
                </Stack>
              </Stack>
            </Row>
            <Row height="content">
              <Box paddingBottom="4px">
                <Inset space="19px (Deprecated)" {...(isSmallPhone && { bottom: '8px' })}>
                  {isLoading && (
                    <Box alignItems="center" paddingBottom="15px (Deprecated)">
                      {/* @ts-expect-error JavaScript component */}
                      <ActivityIndicator />
                    </Box>
                  )}
                  {isFetched && (
                    <>
                      {controlledDomains?.length === 0 ? (
                        <Inset bottom={android ? '10px' : undefined}>
                          <SheetActionButton
                            color={colors.appleBlue}
                            label={'􀠎 ' + lang.t('profiles.intro.find_your_name')}
                            lightShadows
                            marginBottom={15}
                            onPress={handleNavigateToSearch}
                            testID="ens-intro-sheet-find-your-name-button"
                            weight="heavy"
                          />
                        </Inset>
                      ) : (
                        <Stack space="12px">
                          {uniqueDomain?.name ? (
                            <SheetActionButton
                              color={colors.appleBlue}
                              label={lang.t(profileExists ? 'profiles.intro.edit_name' : 'profiles.intro.use_name', {
                                name: abbreviateEnsForDisplay(uniqueDomain?.name, 15),
                              })}
                              lightShadows
                              onPress={handleSelectUniqueDomain}
                              weight="heavy"
                            />
                          ) : (
                            <SheetActionButton
                              color={colors.appleBlue}
                              label={lang.t('profiles.intro.use_existing_name')}
                              lightShadows
                              onPress={handleSelectExistingName}
                              weight="heavy"
                            />
                          )}
                          {nonPrimaryDomains?.length > 0 ? (
                            <ContextMenuRenderer
                              handleNavigateToSearch={handleNavigateToSearch}
                              handleSelectExistingName={handleSelectExistingName}
                            >
                              <SheetActionButton
                                color={colors.transparent}
                                isTransparent
                                label={lang.t('profiles.intro.choose_another_name')}
                                textColor={colors.appleBlue}
                                textSize="lmedium"
                                weight="bold"
                              />
                            </ContextMenuRenderer>
                          ) : (
                            <SheetActionButton
                              color={colors.transparent}
                              isTransparent
                              label={lang.t('profiles.intro.search_new_name')}
                              onPress={handleNavigateToSearch}
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

function InfoRow({ icon, title, description }: { icon: string; title: string; description: string }) {
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
              <Heading align="center" color="action (Deprecated)" size="28px / 33px (Deprecated)" weight="bold">
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
          <Text color="primary (Deprecated)" size="16px / 22px (Deprecated)" weight="bold">
            {title}
          </Text>
          <Text color="secondary60 (Deprecated)" size="14px / 19px (Deprecated)" weight="medium">
            {description}
          </Text>
        </Stack>
      </Bleed>
    </Columns>
  );
}
