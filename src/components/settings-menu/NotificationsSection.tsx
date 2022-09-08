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
import { useWallets } from '@/hooks';
import profileUtils from '@/utils/profileUtils';
import {
  getAllNotificationSettingsFromStorage,
  NotificationRelationship,
  useNotificationSettings,
  useWalletGroupNotificationSettings,
  WalletNotificationSettingsType,
} from '@/utils/notifications';
import { deviceUtils } from '@/utils';
import Animated, {
  useAnimatedStyle,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Box } from '@/design-system';
import Spinner from '../Spinner';
import { useTheme } from '@/theme';

type WalletRowProps = {
  groupOff: boolean;
  wallet: {
    address: string;
    color?: string;
    image?: string;
    label: string;
  };
};

type WalletRowLabelProps = {
  groupOff: boolean;
  notifications: {
    enabled: boolean;
    topics: object;
  };
};

const WalletRowLabel = ({ notifications, groupOff }: WalletRowLabelProps) => {
  const deviceWidth = deviceUtils.dimensions.width;
  const AMOUNT_OF_TOPICS_TO_DISPLAY = deviceWidth > 400 ? 3 : 2;
  const allTopicsEnabled = Object.values(notifications.topics).every(
    topic => topic
  );
  const allTopicsDisabled =
    groupOff || Object.values(notifications.topics).every(topic => !topic);
  const enabledTopics = Object.keys(notifications.topics).filter(
    // @ts-expect-error: why are you yelling
    topic => notifications.topics[topic]
  );

  const composedLabel = () => {
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
  };

  return <MenuItem.Label text={composedLabel()} />;
};

const WalletRow = ({ wallet, groupOff }: WalletRowProps) => {
  const index = useNavigationState(state => state.index);
  const { navigate } = useNavigation();
  const { notifications } = useNotificationSettings(wallet.address);
  const [notificationSettings, setNotificationSettings] = useState(
    notifications
  );

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
      key={wallet.address}
      hasRightArrow
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
      onPress={() => navigateToWalletSettings(wallet.label, wallet.address)}
      size={52}
      titleComponent={<MenuItem.Title text={wallet.label} />}
    />
  );
};

const NotificationsSection = () => {
  const { colors } = useTheme();
  const { wallets } = useWallets();
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const walletIDs = Object.keys(wallets!);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ownedWallets: any[] = useMemo(() => [], []);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const watchedWallets: any[] = useMemo(() => [], []);
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
    if (watchedWallets.length < 1 && ownedWallets.length < 1) {
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

  const openSystemSettings = () => {
    Linking.openSettings();
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
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
    };
  });

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

            <Menu
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
                    disabled={noOwnedWallets}
                    onValueChange={toggleAllOwnedNotifications}
                    value={ownerEnabled}
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
                  groupOff={!ownerEnabled}
                />
              ))}
            </Menu>
            <Menu
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
                    disabled={noWatchedWallets}
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
                />
              ))}
            </Menu>
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
