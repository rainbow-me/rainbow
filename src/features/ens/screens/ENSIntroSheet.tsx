import React, { useCallback, useMemo } from 'react';
import { InteractionManager, Platform } from 'react-native';

import MaskedView from '@react-native-masked-view/masked-view';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivityIndicator } from '@/components/ActivityIndicator';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import SheetActionButton from '@/components/sheet/sheet-action-buttons/SheetActionButton';
import { Bleed, Box, Column, Columns, Heading, Inset, Row, Rows, Separator, Stack, Text } from '@/design-system';
import { IS_TEST } from '@/env';
import { abbreviateName } from '@/features/address/core/formatAddress';
import { useEnsImageStore } from '@/features/ens/data/stores/imageStore';
import { useEnsNameStore } from '@/features/ens/data/useEnsNameStore';
import { REGISTRATION_MODES } from '@/features/ens/types/registration';
import useDimensions from '@/hooks/useDimensions';
import * as i18n from '@/languages';
import { useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { type RootStackParamList } from '@/navigation/types';
import { useAccountAddress } from '@/state/wallets/walletsStore';
import { useTheme } from '@/theme/ThemeContext';

import { IntroMarquee } from '../components/registration/IntroMarquee';
import { useEnsRecordsStore } from '../data/stores/recordsStore';
import { useEnsRegistrationStore } from '../data/stores/registrationStore';
import { useAccountENSDomains } from '../hooks/useAccountENSDomains';

enum AnotherENSEnum {
  search = 'search',
  my_ens = 'my_ens',
}

const topPadding = Platform.OS === 'android' ? 29 : 19;

const minHeight = 740;

type ChooseAnotherNameButtonProps = {
  handleSelectExistingName: () => void;
  handleNavigateToSearch: () => void;
};

const ChooseAnotherNameButton = ({ handleSelectExistingName, handleNavigateToSearch }: ChooseAnotherNameButtonProps) => {
  const { colors } = useTheme();
  const menuConfig = useMemo(() => {
    return {
      menuItems: [
        {
          actionKey: AnotherENSEnum.my_ens,
          actionTitle: i18n.t(i18n.l.profiles.intro.my_ens_names),
          icon: {
            iconType: 'SYSTEM',
            iconValue: 'rectangle.stack.badge.person.crop',
          },
        },
        {
          actionKey: AnotherENSEnum.search,
          actionTitle: i18n.t(i18n.l.profiles.intro.search_new_ens),
          icon: {
            iconType: 'SYSTEM',
            iconValue: 'magnifyingglass',
          },
        },
      ],
      menuTitle: '',
    };
  }, []);

  const handlePressMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }: { nativeEvent: { actionKey: string } }) => {
      if (actionKey === AnotherENSEnum.my_ens) {
        handleSelectExistingName();
      } else if (actionKey === AnotherENSEnum.search) {
        handleNavigateToSearch();
      }
    },
    [handleNavigateToSearch, handleSelectExistingName]
  );

  return (
    <ContextMenuButton menuConfig={menuConfig} onPressMenuItem={handlePressMenuItem}>
      <SheetActionButton
        color={colors.transparent}
        isTransparent
        label={i18n.t(i18n.l.profiles.intro.choose_another_name)}
        textColor={colors.appleBlue}
        textSize="lmedium"
        weight="bold"
      />
    </ContextMenuButton>
  );
};

export function ENSIntroSheet() {
  const { width: deviceWidth, height: deviceHeight } = useDimensions();
  const { colors } = useTheme();
  const { params } = useRoute<RouteProp<RootStackParamList, typeof Routes.ENS_INTRO_SHEET>>();
  const { navigate } = useNavigation();

  const accountAddress = useAccountAddress();
  const { data: names, isFetched: hasSettled } = useAccountENSDomains(accountAddress);
  const primaryName = useEnsNameStore(s => s.get(accountAddress));
  const ownsPrimaryName = !!primaryName && !!names?.includes(primaryName);
  const suggestedName = ownsPrimaryName ? primaryName : names?.length === 1 ? names[0] : undefined;
  const ensRecords = useEnsRecordsStore(s => s.get(suggestedName || undefined));
  const ensAvatar = useEnsImageStore(s => s.get(suggestedName ? { name: suggestedName, field: 'avatar' } : undefined));

  const profileExists = useMemo(() => {
    if (ensAvatar) return true;
    if (!ensRecords) return false;
    return !!ensRecords.contenthash || Object.keys(ensRecords.coinAddresses).length > 1 || Object.keys(ensRecords.records).length > 0;
  }, [ensAvatar, ensRecords]);

  // We are not using `isSmallPhone` from `useDimensions` here as we
  // want to explicitly set a min height.
  const isSmallPhone = deviceHeight < minHeight;

  const contentHeight = params?.contentHeight;
  const contentWidth = Math.min(deviceWidth - 72, 300);

  const handleNavigateToSearch = useCallback(() => {
    params?.onSearchForNewName?.();
    InteractionManager.runAfterInteractions(() => {
      useEnsRegistrationStore.getState().start(accountAddress, '', REGISTRATION_MODES.CREATE);
      navigate(Routes.ENS_SEARCH_SHEET);
    });
  }, [navigate, params, accountAddress]);

  const navigateToAssignRecords = useCallback(
    (ensName: string) => {
      useEnsRegistrationStore.getState().start(accountAddress, ensName, REGISTRATION_MODES.EDIT);
      InteractionManager.runAfterInteractions(() => {
        params?.onSelectExistingName?.();
        navigate(Routes.ENS_ASSIGN_RECORDS_SHEET);
      });
    },
    [navigate, params, accountAddress]
  );

  const handleSelectSuggestedName = useCallback(() => {
    if (suggestedName) {
      navigateToAssignRecords(suggestedName);
    }
  }, [navigateToAssignRecords, suggestedName]);

  const handleSelectExistingName = useCallback(() => {
    navigate(Routes.SELECT_ENS_SHEET, {
      onSelectENS: (ensName: string) => {
        navigateToAssignRecords(ensName);
      },
    });
  }, [navigate, navigateToAssignRecords]);

  const insets = useSafeAreaInsets();

  return (
    <Box background="body (Deprecated)" paddingTop={{ custom: topPadding }} style={{ height: contentHeight }} testID="ens-intro-sheet">
      <Inset top={isSmallPhone ? '15px (Deprecated)' : '36px'}>
        <Box height="full">
          <Rows>
            <Row>
              <Stack space={{ custom: isSmallPhone ? 30 : 38 }}>
                <Stack alignHorizontal="center" space={{ custom: 17 }}>
                  <Heading align="center" color="primary (Deprecated)" size="34px / 41px (Deprecated)" weight="heavy">
                    {i18n.t(i18n.l.profiles.intro.create_your)}
                  </Heading>
                  <Heading align="center" color="action (Deprecated)" size="34px / 41px (Deprecated)" weight="heavy">
                    {i18n.t(i18n.l.profiles.intro.ens_profile)}
                  </Heading>
                </Stack>
                <Stack space={{ custom: isSmallPhone ? 30 : 40 }}>
                  <Bleed left="10px">{!IS_TEST && <IntroMarquee isSmallPhone={isSmallPhone} />}</Bleed>
                  <Inset horizontal="34px (Deprecated)">
                    <Separator color="divider60 (Deprecated)" />
                  </Inset>
                </Stack>
                <Stack alignHorizontal="center">
                  <Box width={{ custom: contentWidth }}>
                    <Inset top="6px">
                      <Stack space={isSmallPhone ? '24px' : '36px'}>
                        <InfoRow
                          description={i18n.t(i18n.l.profiles.intro.wallet_address_info.description)}
                          icon="􀈠"
                          title={i18n.t(i18n.l.profiles.intro.wallet_address_info.title)}
                        />
                        <InfoRow
                          description={i18n.t(i18n.l.profiles.intro.portable_identity_info.description)}
                          icon="􀪽"
                          title={i18n.t(i18n.l.profiles.intro.portable_identity_info.title)}
                        />
                        <InfoRow
                          description={i18n.t(i18n.l.profiles.intro.stored_on_blockchain_info.description)}
                          icon="􀐙"
                          title={i18n.t(i18n.l.profiles.intro.stored_on_blockchain_info.title)}
                        />
                      </Stack>
                    </Inset>
                  </Box>
                </Stack>
              </Stack>
            </Row>
            <Row height="content">
              <Box paddingBottom="4px">
                <Inset bottom={{ custom: insets.bottom + 8 }} space="19px (Deprecated)">
                  {!!accountAddress && !hasSettled && (
                    <Box alignItems="center" paddingBottom="15px (Deprecated)">
                      <ActivityIndicator />
                    </Box>
                  )}
                  {hasSettled && (
                    <>
                      {names?.length === 0 ? (
                        <Inset bottom={Platform.OS === 'android' ? '10px' : undefined}>
                          <SheetActionButton
                            color={colors.appleBlue}
                            label={'􀠎 ' + i18n.t(i18n.l.profiles.intro.find_your_name)}
                            lightShadows
                            marginBottom={15}
                            onPress={handleNavigateToSearch}
                            testID="ens-intro-sheet-find-your-name-button"
                            weight="heavy"
                          />
                        </Inset>
                      ) : (
                        <Stack space="12px">
                          {suggestedName ? (
                            <SheetActionButton
                              color={colors.appleBlue}
                              label={i18n.t(profileExists ? i18n.l.profiles.intro.edit_name : i18n.l.profiles.intro.use_name, {
                                name: abbreviateName(suggestedName, 15) as string,
                              })}
                              lightShadows
                              onPress={handleSelectSuggestedName}
                              weight="heavy"
                            />
                          ) : (
                            <SheetActionButton
                              color={colors.appleBlue}
                              label={i18n.t(i18n.l.profiles.intro.use_existing_name)}
                              lightShadows
                              onPress={handleSelectExistingName}
                              weight="heavy"
                            />
                          )}
                          {(names?.length ?? 0) > (ownsPrimaryName ? 1 : 0) ? (
                            <ChooseAnotherNameButton
                              handleNavigateToSearch={handleNavigateToSearch}
                              handleSelectExistingName={handleSelectExistingName}
                            />
                          ) : (
                            <SheetActionButton
                              color={colors.transparent}
                              isTransparent
                              label={i18n.t(i18n.l.profiles.intro.search_new_name)}
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
              {...(Platform.OS === 'android' && {
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
