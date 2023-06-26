import lang from 'i18n-js';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Switch } from 'react-native';
import { ContactAvatar } from '../../../components/contacts';
import ImageAvatar from '../../../components/contacts/ImageAvatar';
import Menu from './Menu';
import MenuContainer from './MenuContainer';
import MenuItem from './MenuItem';
import { checkNotifications, RESULTS } from 'react-native-permissions';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import WalletTypes from '@/helpers/walletTypes';
import { useAccountSettings, useAppState, useWallets } from '@/hooks';
import { requestPermission } from '@/notifications/permissions';
import profileUtils from '@/utils/profileUtils';
import { abbreviations, deviceUtils } from '@/utils';
import { BackgroundProvider, Box, Inline, Inset, Text } from '@/design-system';
import {
  removeFirstEmojiFromString,
  returnStringFirstEmoji,
} from '@/helpers/emojiHandler';
import { RainbowAccount } from '@/model/wallet';
import { isTestnetNetwork } from '@/handlers/web3';
import { useFocusEffect } from '@react-navigation/native';
import { SettingsLoadingIndicator } from '@/screens/SettingsSheet/components/SettingsLoadingIndicator';
import {
  showNotificationSubscriptionErrorAlert,
  showOfflineAlert,
} from '@/screens/SettingsSheet/components/notificationAlerts';
import { useNetInfo } from '@react-native-community/netinfo';
import {
  NotificationRelationship,
  updateSettingsForWalletsWithRelationshipType,
  useAllNotificationSettingsFromStorage,
  useWalletGroupNotificationSettings,
  WalletNotificationSettings,
} from '@/notifications/settings';
import { getNotificationSettingsForWalletWithAddress } from '@/notifications/settings/storage';
import { SimpleSheet } from '@/components/sheet/SimpleSheet';

type WalletRowProps = {
  ens: string;
  groupOff: boolean;
  isTestnet: boolean;
  loading?: boolean;
  notificationSettings: WalletNotificationSettings[];
  wallet: RainbowAccount;
};

type WalletRowLabelProps = {
  groupOff: boolean;
  notifications?: WalletNotificationSettings;
};

const DEVICE_WIDTH = deviceUtils.dimensions.width;
const AMOUNT_OF_TOPICS_TO_DISPLAY = DEVICE_WIDTH > 400 ? 3 : 2;

const WalletRowLabel = ({ notifications, groupOff }: WalletRowLabelProps) => {
  const composedLabel = useMemo(() => {
    if (!notifications) return lang.t('settings.notifications_section.off');
    const allTopicsEnabled = Object.values(notifications.topics).every(
      topic => topic
    );
    const allTopicsDisabled =
      groupOff || Object.values(notifications.topics).every(topic => !topic);
    const enabledTopics = Object.keys(notifications.topics).filter(
      topic => notifications.topics[(topic as unknown) as number]
    );

    if (allTopicsDisabled) {
      return lang.t('settings.notifications_section.off');
    }

    if (notifications.enabled) {
      if (allTopicsEnabled) {
        return lang.t('settings.notifications_section.all');
      }

      if (enabledTopics.length > AMOUNT_OF_TOPICS_TO_DISPLAY) {
        const limitedTopics = enabledTopics
          .slice(0, AMOUNT_OF_TOPICS_TO_DISPLAY)
          .map(topic => lang.t(`settings.notifications_section.${topic}`))
          .join(', ');

        return `${limitedTopics} ${lang.t(
          'settings.notifications_section.plus_n_more',
          {
            n: enabledTopics.length - AMOUNT_OF_TOPICS_TO_DISPLAY,
          }
        )}`;
      } else {
        return enabledTopics
          .map(topic => lang.t(`settings.notifications_section.${topic}`))
          .join(', ');
      }
    } else {
      return lang.t('settings.notifications_section.off');
    }
  }, [groupOff, notifications]);

  return <MenuItem.Label text={composedLabel} />;
};

const WalletRow = ({
  ens,
  groupOff,
  isTestnet,
  loading,
  notificationSettings,
  wallet,
}: WalletRowProps) => {
  const { navigate } = useNavigation();
  const notificationSetting = notificationSettings?.find(
    (x: WalletNotificationSettings) => x.address === wallet.address
  );
  const cleanedUpLabel = useMemo(
    () => removeFirstEmojiFromString(wallet.label),
    [wallet.label]
  );

  const displayAddress = useMemo(
    () => abbreviations.address(wallet.address, 4, 6),
    [wallet.address]
  );
  const walletName = cleanedUpLabel || ens || displayAddress || '';

  const navigateToWalletSettings = useCallback(
    (name: string, address: string) => {
      const settingsForWallet = getNotificationSettingsForWalletWithAddress(
        address
      );

      if (settingsForWallet) {
        navigate(Routes.WALLET_NOTIFICATIONS_SETTINGS, {
          title: name,
          notificationSettings: settingsForWallet,
          address,
        });
      } else {
        Alert.alert(
          lang.t(
            'settings.notifications_section.no_settings_for_address_title'
          ),
          lang.t(
            'settings.notifications_section.no_settings_for_address_content'
          ),
          [{ text: 'OK' }]
        );
      }
    },
    [navigate]
  );

  const rowEnabled = useMemo(() => {
    const enabledTopics = notificationSetting
      ? Object.values(notificationSetting.topics).filter(topic =>
          Boolean(topic)
        )
      : [];
    return !groupOff && enabledTopics.length && notificationSetting?.enabled;
  }, [groupOff, notificationSetting]);

  return (
    <MenuItem
      disabled={isTestnet || loading}
      key={wallet.address}
      hasRightArrow={!isTestnet}
      labelComponent={
        <WalletRowLabel
          notifications={notificationSetting}
          groupOff={groupOff}
        />
      }
      leftComponent={
        <Box
          style={{
            opacity: rowEnabled ? 1 : 0.25,
          }}
        >
          {wallet.image ? (
            <ImageAvatar
              image={wallet.image}
              size={rowEnabled ? 'smedium' : 'smedium_shadowless'}
            />
          ) : (
            <ContactAvatar
              color={wallet.color}
              size={rowEnabled ? 'small' : 'small_shadowless'}
              value={
                returnStringFirstEmoji(wallet.label) ||
                profileUtils.addressHashedEmoji(wallet.address)
              }
            />
          )}
        </Box>
      }
      onPress={() => navigateToWalletSettings(walletName, wallet.address)}
      size={52}
      titleComponent={<MenuItem.Title text={walletName} />}
    />
  );
};

const NotificationsSection = () => {
  const { justBecameActive } = useAppState();
  const { navigate } = useNavigation();
  const { network } = useAccountSettings();
  const isTestnet = isTestnetNetwork(network);
  const { wallets, walletNames } = useWallets();
  const { isConnected } = useNetInfo();

  const {
    ownerEnabled: storedOwnerEnabled,
    updateGroupSettingsAndSubscriptions,
    watcherEnabled: storedWatcherEnabled,
  } = useWalletGroupNotificationSettings();
  // local state controls the switch UI for better UX
  const [ownedState, setOwnedState] = useState({
    status: storedOwnerEnabled,
    loading: false,
  });
  const [watchedState, setWatchedState] = useState({
    status: storedWatcherEnabled,
    loading: false,
  });
  const { notificationSettings } = useAllNotificationSettingsFromStorage();
  const { ownedWallets, watchedWallets } = useMemo(() => {
    const ownedWallets: RainbowAccount[] = [];
    const watchedWallets: RainbowAccount[] = [];
    // group wallets by relationship if the arrays are empty
    if (watchedWallets.length === 0 && ownedWallets.length === 0) {
      const walletIDs = Object.keys(wallets ?? {});
      walletIDs.forEach(key => {
        const wallet = wallets?.[key];

        if (wallet?.type === WalletTypes.readOnly) {
          wallet?.addresses.forEach(
            item => item.visible && watchedWallets.push({ ...item })
          );
        } else {
          wallet?.addresses.forEach(
            item => item.visible && ownedWallets.push(item)
          );
        }
      });
    }

    return { ownedWallets, watchedWallets };
  }, [wallets]);

  useFocusEffect(
    useCallback(() => {
      setOwnedState({ loading: false, status: storedOwnerEnabled });
      setWatchedState({ loading: false, status: storedWatcherEnabled });
    }, [storedOwnerEnabled, storedWatcherEnabled])
  );

  const noOwnedWallets = !ownedWallets.length;
  const noWatchedWallets = !watchedWallets.length;
  const [permissionStatus, setPermissionStatus] = useState<string>('');
  const neverGranted = permissionStatus === RESULTS.DENIED;
  const disabledInSystem = permissionStatus === RESULTS.BLOCKED;

  const toggleAllOwnedNotifications = useCallback(() => {
    if (!isConnected) {
      showOfflineAlert();
      return;
    }
    setOwnedState(prev => ({ status: !prev.status, loading: true }));
    updateGroupSettingsAndSubscriptions(
      NotificationRelationship.OWNER,
      !storedOwnerEnabled
    )
      .then(() => {
        setOwnedState(prev => ({ ...prev, loading: false }));
        updateSettingsForWalletsWithRelationshipType(
          NotificationRelationship.OWNER,
          {
            successfullyFinishedInitialSubscription: true,
            enabled: !storedOwnerEnabled,
          }
        );
      })
      .catch(() => {
        showNotificationSubscriptionErrorAlert();
        setOwnedState(prev => ({ status: !prev.status, loading: false }));
      });
  }, [storedOwnerEnabled, updateGroupSettingsAndSubscriptions, isConnected]);

  const toggleAllWatchedNotifications = useCallback(() => {
    if (!isConnected) {
      showOfflineAlert();
      return;
    }
    setWatchedState(prev => ({ status: !prev.status, loading: true }));
    updateGroupSettingsAndSubscriptions(
      NotificationRelationship.WATCHER,
      !storedWatcherEnabled
    )
      .then(() => {
        setWatchedState(prev => ({ ...prev, loading: false }));
        updateSettingsForWalletsWithRelationshipType(
          NotificationRelationship.WATCHER,
          {
            successfullyFinishedInitialSubscription: true,
            enabled: !storedWatcherEnabled,
          }
        );
      })
      .catch(() => {
        showNotificationSubscriptionErrorAlert();
        setWatchedState(prev => ({ status: !prev.status, loading: false }));
      });
  }, [updateGroupSettingsAndSubscriptions, storedWatcherEnabled, isConnected]);

  const openSystemSettings = Linking.openSettings;
  const openNetworkSettings = useCallback(
    () => navigate(Routes.NETWORK_SWITCHER),
    [navigate]
  );

  const requestNotificationPermissions = useCallback(async () => {
    requestPermission().then(allowed => {
      if (allowed) {
        setPermissionStatus(RESULTS.GRANTED);
      } else {
        openSystemSettings();
      }
    });
  }, [openSystemSettings]);

  const checkPermissions = useCallback(async () => {
    checkNotifications().then(({ status }) => {
      setPermissionStatus(status);
    });
  }, []);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions, justBecameActive]);

  return (
    <BackgroundProvider color="surfaceSecondary">
      {({ backgroundColor }) => (
        <SimpleSheet backgroundColor={backgroundColor as string}>
          <Inset top="20px" horizontal="20px" bottom="60px">
            <Inline alignHorizontal="center" alignVertical="center">
              <Box paddingBottom="12px">
                <Text size="22pt" weight="heavy" color="label">
                  {lang.t('settings.notifications')}
                </Text>
              </Box>
            </Inline>
            <Box>
              <MenuContainer
                // required key to force re-render when permission status changes
                // while the app is in the background
                key={permissionStatus}
              >
                {neverGranted && (
                  <Menu
                    description={lang.t(
                      'settings.notifications_section.no_first_time_permissions'
                    )}
                  >
                    <MenuItem
                      hasSfSymbol
                      size={52}
                      leftComponent={<MenuItem.TextIcon icon="􀝖" isLink />}
                      titleComponent={
                        <MenuItem.Title
                          text={lang.t(
                            'settings.notifications_section.first_time_allow_notifications'
                          )}
                          weight="bold"
                          isLink
                        />
                      }
                      onPress={requestNotificationPermissions}
                    />
                  </Menu>
                )}

                {disabledInSystem && (
                  <Menu
                    description={lang.t(
                      'settings.notifications_section.no_permissions'
                    )}
                  >
                    <MenuItem
                      hasSfSymbol
                      size={52}
                      leftComponent={<MenuItem.TextIcon icon="􀍟" isLink />}
                      titleComponent={
                        <MenuItem.Title
                          text={lang.t(
                            'settings.notifications_section.open_system_settings'
                          )}
                          weight="bold"
                          isLink
                        />
                      }
                      onPress={openSystemSettings}
                    />
                  </Menu>
                )}

                {isTestnet ? (
                  <Menu
                    description={lang.t(
                      'settings.notifications_section.unsupported_network'
                    )}
                  >
                    <MenuItem
                      hasSfSymbol
                      size={52}
                      leftComponent={<MenuItem.TextIcon icon="􀇂" isLink />}
                      titleComponent={
                        <MenuItem.Title
                          text={lang.t(
                            'settings.notifications_section.change_network'
                          )}
                          weight="bold"
                          isLink
                        />
                      }
                      onPress={openNetworkSettings}
                    />
                  </Menu>
                ) : (
                  <>
                    <Menu
                      description={
                        noOwnedWallets
                          ? lang.t(
                              'settings.notifications_section.no_owned_wallets'
                            )
                          : ''
                      }
                    >
                      <MenuItem
                        disabled
                        rightComponent={
                          <>
                            {ownedState.loading && <SettingsLoadingIndicator />}
                            <Switch
                              disabled={
                                noOwnedWallets ||
                                isTestnet ||
                                ownedState.loading
                              }
                              onValueChange={toggleAllOwnedNotifications}
                              value={ownedState.status}
                            />
                          </>
                        }
                        size={52}
                        titleComponent={
                          <MenuItem.Title
                            text={lang.t(
                              'settings.notifications_section.my_wallets'
                            )}
                            weight="bold"
                          />
                        }
                      />
                      {ownedWallets.map(wallet => (
                        <WalletRow
                          ens={walletNames[wallet.address]}
                          groupOff={!storedOwnerEnabled}
                          isTestnet={isTestnet}
                          key={wallet.address}
                          loading={ownedState.loading}
                          notificationSettings={notificationSettings}
                          wallet={wallet}
                        />
                      ))}
                    </Menu>
                    <Menu
                      description={
                        noWatchedWallets
                          ? lang.t(
                              'settings.notifications_section.no_watched_wallets'
                            )
                          : ''
                      }
                    >
                      <MenuItem
                        disabled
                        rightComponent={
                          <>
                            {watchedState.loading && (
                              <SettingsLoadingIndicator />
                            )}
                            <Switch
                              disabled={
                                noWatchedWallets ||
                                isTestnet ||
                                watchedState.loading
                              }
                              onValueChange={toggleAllWatchedNotifications}
                              value={watchedState.status}
                            />
                          </>
                        }
                        size={52}
                        titleComponent={
                          <MenuItem.Title
                            text={lang.t(
                              'settings.notifications_section.watched_wallets'
                            )}
                            weight="bold"
                          />
                        }
                      />
                      {watchedWallets.map(wallet => (
                        <WalletRow
                          ens={walletNames[wallet.address]}
                          groupOff={!storedWatcherEnabled}
                          isTestnet={isTestnet}
                          key={wallet.address}
                          loading={watchedState.loading}
                          notificationSettings={notificationSettings}
                          wallet={wallet}
                        />
                      ))}
                    </Menu>
                  </>
                )}
              </MenuContainer>
            </Box>
          </Inset>
        </SimpleSheet>
      )}
    </BackgroundProvider>
  );
};

export default NotificationsSection;
