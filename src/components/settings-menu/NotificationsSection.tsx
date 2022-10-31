import lang from 'i18n-js';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Linking, Switch } from 'react-native';
import { ContactAvatar } from '../contacts';
import ImageAvatar from '../contacts/ImageAvatar';
import Menu from './components/Menu';
import MenuContainer from './components/MenuContainer';
import MenuItem from './components/MenuItem';
import { checkNotifications, RESULTS } from 'react-native-permissions';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import WalletTypes from '@/helpers/walletTypes';
import { useAccountSettings, useAppState, useWallets } from '@/hooks';
import { requestPermission } from '@/notifications/permissions';
import profileUtils from '@/utils/profileUtils';
import {
  addDefaultNotificationSettingsForWallet,
  NotificationRelationship,
  updateSettingsForWallets,
  useAllNotificationSettingsFromStorage,
  useWalletGroupNotificationSettings,
  WalletNotificationSettings,
} from '@/notifications/settings';
import { abbreviations, deviceUtils } from '@/utils';
import { Box } from '@/design-system';
import {
  removeFirstEmojiFromString,
  returnStringFirstEmoji,
} from '@/helpers/emojiHandler';
import { RainbowAccount } from '@/model/wallet';
import { isTestnetNetwork } from '@/handlers/web3';
import { useFocusEffect } from '@react-navigation/native';

type WalletRowProps = {
  groupOff: boolean;
  isTestnet: boolean;
  wallet: RainbowAccount;
  ens: string;
  notificationSettings: WalletNotificationSettings[];
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
  wallet,
  groupOff,
  isTestnet,
  notificationSettings,
  ens,
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
    (name, address) => {
      navigate(Routes.WALLET_NOTIFICATIONS_SETTINGS, {
        title: name,
        address,
      });
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
      disabled={isTestnet}
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

  const {
    ownerEnabled: centralOwnedStatus,
    updateGroupSettings,
    watcherEnabled: centralWatchedStatus,
  } = useWalletGroupNotificationSettings();
  // local state controls the switch UI for better UX
  const [ownedState, setOwnedState] = useState({
    status: centralOwnedStatus,
    loading: false,
  });
  const [watchedState, setWatchedState] = useState({
    status: centralWatchedStatus,
    loading: false,
  });
  const { notificationSettings } = useAllNotificationSettingsFromStorage();
  const { ownedWallets, watchedWallets } = useMemo(() => {
    const ownedWallets: RainbowAccount[] = [];
    const watchedWallets: RainbowAccount[] = [];
    // group wallets by relationship if the arrays are empty
    if (watchedWallets.length === 0 && ownedWallets.length === 0) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const walletIDs = Object.keys(wallets!);
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
      setOwnedState({ loading: false, status: centralOwnedStatus });
      setWatchedState({ loading: false, status: centralWatchedStatus });
    }, [])
  );

  const noOwnedWallets = !ownedWallets.length;
  const noWatchedWallets = !watchedWallets.length;
  const [permissionStatus, setPermissionStatus] = useState<string>('');
  const neverGranted = permissionStatus === RESULTS.DENIED;
  const disabledInSystem = permissionStatus === RESULTS.BLOCKED;

  const toggleAllOwnedNotifications = useCallback(() => {
    setOwnedState(prev => ({ status: !prev.status, loading: true }));
    updateGroupSettings(NotificationRelationship.OWNER, !centralOwnedStatus)
      .then(() => {
        setOwnedState(prev => ({ ...prev, loading: false }));
      })
      .catch(() => {
        setOwnedState(prev => ({ status: !prev.status, loading: false }));
      });
    updateSettingsForWallets(NotificationRelationship.OWNER, {
      enabled: !centralOwnedStatus,
    });
  }, [centralOwnedStatus, updateGroupSettings]);

  const toggleAllWatchedNotifications = useCallback(() => {
    setWatchedState(prev => ({ status: !prev.status, loading: true }));
    updateGroupSettings(NotificationRelationship.WATCHER, !centralWatchedStatus)
      .then(() => {
        setWatchedState(prev => ({ ...prev, loading: false }));
      })
      .catch(() => {
        setWatchedState(prev => ({ status: !prev.status, loading: false }));
      });
    updateSettingsForWallets(NotificationRelationship.WATCHER, {
      enabled: !centralWatchedStatus,
    });
  }, [updateGroupSettings, centralWatchedStatus]);

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
    // populate notification settings if they
    // have been cleared from dev settings to prevent a crash
    // when going to the notification settings screen for a wallet
    if (notificationSettings.length === 0) {
      ownedWallets.forEach(wallet => {
        addDefaultNotificationSettingsForWallet(
          wallet.address,
          NotificationRelationship.OWNER
        );
      });

      watchedWallets.forEach(wallet => {
        addDefaultNotificationSettingsForWallet(
          wallet.address,
          NotificationRelationship.WATCHER
        );
      });
    }
  }, [
    checkPermissions,
    justBecameActive,
    notificationSettings,
    ownedWallets,
    watchedWallets,
  ]);

  return (
    <Box>
      <MenuContainer
        // requird key to force re-render when permission status changes
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
                  text={lang.t('settings.notifications_section.change_network')}
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
              loading={ownedState.loading}
              description={
                noOwnedWallets
                  ? lang.t('settings.notifications_section.no_owned_wallets')
                  : ''
              }
            >
              <MenuItem
                disabled
                rightComponent={
                  <Switch
                    disabled={noOwnedWallets || isTestnet || ownedState.loading}
                    onValueChange={toggleAllOwnedNotifications}
                    value={ownedState.status}
                  />
                }
                size={52}
                titleComponent={
                  <MenuItem.Title
                    text={lang.t('settings.notifications_section.my_wallets')}
                    weight="bold"
                  />
                }
              />
              {ownedWallets.map(wallet => (
                <WalletRow
                  key={wallet.address}
                  wallet={wallet}
                  groupOff={!centralOwnedStatus}
                  isTestnet={isTestnet}
                  ens={walletNames[wallet.address]}
                  notificationSettings={notificationSettings}
                />
              ))}
            </Menu>
            <Menu
              loading={watchedState.loading}
              description={
                noWatchedWallets
                  ? lang.t('settings.notifications_section.no_watched_wallets')
                  : ''
              }
            >
              <MenuItem
                disabled
                rightComponent={
                  <Switch
                    disabled={
                      noWatchedWallets || isTestnet || watchedState.loading
                    }
                    onValueChange={toggleAllWatchedNotifications}
                    value={watchedState.status}
                  />
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
                  key={wallet.address}
                  wallet={wallet}
                  groupOff={!centralWatchedStatus}
                  isTestnet={isTestnet}
                  ens={walletNames[wallet.address]}
                  notificationSettings={notificationSettings}
                />
              ))}
            </Menu>
          </>
        )}
      </MenuContainer>
    </Box>
  );
};

export default NotificationsSection;
