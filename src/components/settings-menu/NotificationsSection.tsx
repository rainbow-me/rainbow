import lang from 'i18n-js';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Linking, Switch } from 'react-native';
import { ContactAvatar } from '../contacts';
import ImageAvatar from '../contacts/ImageAvatar';
import Menu from './components/Menu';
import MenuContainer from './components/MenuContainer';
import MenuItem from './components/MenuItem';
import { checkNotifications, RESULTS } from 'react-native-permissions';
import { useNavigationState } from '@react-navigation/native';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import WalletTypes from '@/helpers/walletTypes';
import { useAccountSettings, useWallets } from '@/hooks';
import profileUtils from '@/utils/profileUtils';
import {
  getAllNotificationSettingsFromStorage,
  NotificationRelationship,
  useNotificationSettings,
  useWalletGroupNotificationSettings,
  WalletNotificationSettingsType,
} from '@/notifications/settings';
import { abbreviations, deviceUtils } from '@/utils';
import Animated, {
  useAnimatedStyle,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Box } from '@/design-system';
import Spinner from '../Spinner';
import { useTheme } from '@/theme';
import { removeFirstEmojiFromString } from '@/helpers/emojiHandler';
import { RainbowAccount } from '@/model/wallet';
import { isTestnetNetwork } from '@/handlers/web3';

type WalletRowProps = {
  groupOff: boolean;
  isTestnet: boolean;
  wallet: RainbowAccount;
};

type WalletRowLabelProps = {
  groupOff: boolean;
  notifications: {
    enabled: boolean;
    topics: string[];
  };
};

const DEVICE_WIDTH = deviceUtils.dimensions.width;
const AMOUNT_OF_TOPICS_TO_DISPLAY = DEVICE_WIDTH > 400 ? 3 : 2;

const WalletRowLabel = ({ notifications, groupOff }: WalletRowLabelProps) => {
  const allTopicsEnabled = Object.values(notifications.topics).every(
    topic => topic
  );
  const allTopicsDisabled =
    groupOff || Object.values(notifications.topics).every(topic => !topic);
  const enabledTopics = Object.keys(notifications.topics).filter(
    topic => notifications.topics[(topic as unknown) as number]
  );

  const composedLabel = useMemo(() => {
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
  }, [allTopicsDisabled, allTopicsEnabled, enabledTopics, notifications]);

  return <MenuItem.Label text={composedLabel} />;
};

const WalletRow = ({ wallet, groupOff, isTestnet }: WalletRowProps) => {
  const index = useNavigationState(state => state.index);
  const { navigate } = useNavigation();
  const { notifications } = useNotificationSettings(wallet.address);
  const [notificationSettings, setNotificationSettings] = useState(
    notifications
  );

  const cleanedUpLabel = useMemo(
    () => removeFirstEmojiFromString(wallet.label),
    [wallet]
  );

  const displayAddress = useMemo(() => {
    return abbreviations.address(wallet.address, 4, 6);
  }, [wallet]);

  const walletName = cleanedUpLabel || displayAddress || '';

  useEffect(() => {
    const data = getAllNotificationSettingsFromStorage();
    const updatedSettings = data.find(
      (x: WalletNotificationSettingsType) => x.address === wallet.address
    );
    setNotificationSettings(updatedSettings);
  }, [index, wallet.address]);

  const navigateToWalletSettings = useCallback(
    (name, address) => {
      navigate(Routes.WALLET_NOTIFICATIONS_SETTINGS, {
        title: name,
        address,
      });
    },
    [navigate]
  );

  return (
    <MenuItem
      disabled={isTestnet}
      key={wallet.address}
      hasRightArrow={!isTestnet}
      labelComponent={
        <WalletRowLabel
          notifications={notificationSettings}
          groupOff={groupOff}
        />
      }
      leftComponent={
        <Box
          style={{
            opacity: groupOff || !notificationSettings.enabled ? 0.25 : 1,
          }}
        >
          {wallet?.image ? (
            <ImageAvatar image={wallet?.image} size="smedium" />
          ) : (
            <ContactAvatar
              color={wallet?.color}
              size="small"
              value={profileUtils.addressHashedEmoji(wallet?.address)}
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
  const { navigate } = useNavigation();
  const { colors } = useTheme();
  const { network } = useAccountSettings();
  const isTestnet = isTestnetNetwork(network);
  const { wallets } = useWallets();
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const walletIDs = Object.keys(wallets!);
  const ownedWallets: RainbowAccount[] = useMemo(() => [], []);
  const watchedWallets: RainbowAccount[] = useMemo(() => [], []);
  const [walletsLoaded, setWalletsLoaded] = useState(false);
  const {
    ownerEnabled,
    watcherEnabled,
    updateGroupSettings,
  } = useWalletGroupNotificationSettings();
  const noOwnedWallets = walletsLoaded && !ownedWallets.length;
  const noWatchedWallets = walletsLoaded && !watchedWallets.length;
  const [permissionStatus, setPermissionStatus] = useState<string | boolean>(
    false
  );
  const noPermissions = permissionStatus !== RESULTS.GRANTED;

  useEffect(() => {
    // group wallets by relationship if the arrays are empty on first load
    if (watchedWallets.length === 0 && ownedWallets.length === 0) {
      walletIDs.forEach(key => {
        const wallet = wallets?.[key];

        if (wallet?.type === WalletTypes.readOnly) {
          wallet?.addresses.forEach(item => watchedWallets.push(item));
        } else {
          wallet?.addresses.forEach(item => ownedWallets.push(item));
        }
      });
    }

    setWalletsLoaded(true);

    checkNotifications().then(({ status }) => {
      setPermissionStatus(status);
    });
  }, [ownedWallets, walletIDs, wallets, watchedWallets]);

  const toggleAllOwnedNotifications = useCallback(
    () =>
      updateGroupSettings({
        [NotificationRelationship.OWNER]: !ownerEnabled,
      }),
    [ownerEnabled, updateGroupSettings]
  );

  const toggleAllWatchedNotifications = useCallback(
    () =>
      updateGroupSettings({
        [NotificationRelationship.WATCHER]: !watcherEnabled,
      }),
    [updateGroupSettings, watcherEnabled]
  );

  const openSystemSettings = Linking.openSettings;
  const openNetworkSettings = useCallback(
    () => navigate(Routes.NETWORK_SWITCHER),
    [navigate]
  );

  const animatedStyle = useAnimatedStyle(
    () => ({
      opacity: withDelay(
        250,
        withTiming(walletsLoaded ? 1 : 0, { duration: 150 })
      ),
      transform: [
        {
          translateY: withDelay(
            250,
            withTiming(walletsLoaded ? 0 : 20, { duration: 150 })
          ),
        },
      ],
    }),
    [walletsLoaded]
  );

  return (
    <Box>
      {walletsLoaded ? (
        <Animated.View style={animatedStyle}>
          <MenuContainer>
            {noPermissions && (
              <Menu
                header={lang.t('settings.notifications_section.no_permissions')}
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
                header={lang.t(
                  'settings.notifications_section.unsupported_network'
                )}
              >
                <MenuItem
                  hasSfSymbol
                  size={52}
                  leftComponent={<MenuItem.TextIcon icon="􀍟" isLink />}
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
                      <Switch
                        disabled={noOwnedWallets || isTestnet}
                        onValueChange={toggleAllOwnedNotifications}
                        value={ownerEnabled}
                      />
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
                      key={wallet.address}
                      wallet={wallet}
                      groupOff={!ownerEnabled}
                      isTestnet={isTestnet}
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
                      <Switch
                        disabled={noWatchedWallets || isTestnet}
                        onValueChange={toggleAllWatchedNotifications}
                        value={watcherEnabled}
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
                      groupOff={!watcherEnabled}
                      isTestnet={isTestnet}
                    />
                  ))}
                </Menu>
              </>
            )}
          </MenuContainer>
        </Animated.View>
      ) : (
        <Box height={'full'} alignItems="center" justifyContent="center">
          <Spinner
            color={colors.appleBlue}
            size={30}
            style={{
              marginTop: -32,
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default NotificationsSection;
