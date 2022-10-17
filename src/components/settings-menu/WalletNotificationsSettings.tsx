import lang from 'i18n-js';
import React, { useCallback, useMemo } from 'react';
import { Switch } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import Menu from './components/Menu';
import MenuContainer from './components/MenuContainer';
import MenuItem from './components/MenuItem';
import { useTheme } from '@/theme';
import { RouteProp, useRoute } from '@react-navigation/native';
import {
  NotificationRelationship,
  NotificationTopic,
  toggleGroupNotifications,
  toggleTopicForWallet,
  useNotificationSettings,
  useWalletGroupNotificationSettings,
} from '@/notifications/settings';

type RouteParams = {
  WalletNotificationsSettings: {
    address: string;
  };
};

const WalletNotificationsSettings = () => {
  const { colors } = useTheme();
  const route = useRoute<
    RouteProp<RouteParams, 'WalletNotificationsSettings'>
  >();
  const { address } = route.params;
  const { notifications, updateSettings } = useNotificationSettings(address);

  const {
    ownerEnabled,
    watcherEnabled,
    lastOwnedWalletEnabled,
    lastWatchedWalletEnabled,
    updateSectionSettings,
  } = useWalletGroupNotificationSettings();

  const {
    notificationsEnabled,
    notificationsSectionEnabled,
    lastWalletEnabled,
  } = useMemo(() => {
    const ownedWallet = notifications.type === NotificationRelationship.OWNER;
    const notificationsSectionEnabled = ownedWallet
      ? ownerEnabled
      : watcherEnabled;
    const lastWalletEnabled = ownedWallet
      ? lastOwnedWalletEnabled
      : lastWatchedWalletEnabled;
    return {
      notificationsEnabled:
        notificationsSectionEnabled && notifications.enabled,
      notificationsSectionEnabled,
      lastWalletEnabled,
    };
  }, [
    notifications.type,
    notifications.enabled,
    ownerEnabled,
    watcherEnabled,
    lastOwnedWalletEnabled,
    lastWatchedWalletEnabled,
  ]);

  const toggleAllowNotifications = useCallback(() => {
    if (
      !notificationsSectionEnabled ||
      (notificationsSectionEnabled && lastWalletEnabled)
    ) {
      updateSectionSettings({
        [notifications.type]: !notificationsEnabled,
      });
    }
    updateSettings({
      enabled: !notificationsEnabled,
    });
    toggleGroupNotifications(
      [notifications],
      notifications.type,
      !notificationsEnabled
    );
  }, [
    notificationsSectionEnabled,
    lastWalletEnabled,
    updateSettings,
    notificationsEnabled,
    notifications,
    updateSectionSettings,
  ]);

  const toggleTopic = useCallback(
    (topic: string) => {
      updateSettings({
        topics: {
          ...notifications.topics,
          [topic]: !notifications?.topics[topic],
        },
      });
      toggleTopicForWallet(
        notifications.type,
        notifications.address,
        topic,
        !notifications?.topics[topic]
      );
    },
    [notifications, updateSettings]
  );

  const animatedStyle = useAnimatedStyle(
    () => ({
      opacity: withTiming(notificationsEnabled ? 1 : 0, {
        duration: 150,
      }),
      transform: [
        {
          translateY: withTiming(notificationsEnabled ? 0 : -20, {
            duration: 150,
            easing: Easing.bezier(0.4, 0, 0.22, 1),
          }),
        },
      ],
    }),
    [notificationsEnabled]
  );

  return (
    <MenuContainer>
      <Menu>
        <MenuItem
          disabled
          rightComponent={
            <Switch
              onValueChange={toggleAllowNotifications}
              value={notificationsEnabled}
            />
          }
          size={52}
          titleComponent={
            <MenuItem.Title
              text={lang.t(
                'settings.notifications_section.allow_notifications'
              )}
              weight="bold"
            />
          }
        />
      </Menu>
      <Animated.View style={animatedStyle}>
        <Menu>
          <MenuItem
            disabled
            hasSfSymbol
            leftComponent={
              <MenuItem.TextIcon colorOverride={colors.appleBlue} icon="􀈟" />
            }
            rightComponent={
              <Switch
                value={notifications?.topics[NotificationTopic.SENT]}
                onValueChange={() => toggleTopic(NotificationTopic.SENT)}
              />
            }
            size={52}
            titleComponent={
              <MenuItem.Title
                text={lang.t('settings.notifications_section.sent')}
              />
            }
          />
          <MenuItem
            disabled
            hasSfSymbol
            leftComponent={
              <MenuItem.TextIcon colorOverride={colors.green} icon="􀅀" />
            }
            rightComponent={
              <Switch
                value={notifications?.topics[NotificationTopic.RECEIVED]}
                onValueChange={() => toggleTopic(NotificationTopic.RECEIVED)}
              />
            }
            size={52}
            titleComponent={
              <MenuItem.Title
                text={lang.t('settings.notifications_section.received')}
              />
            }
          />
          <MenuItem
            disabled
            hasSfSymbol
            leftComponent={
              <MenuItem.TextIcon colorOverride={colors.pink} icon="􀑉" />
            }
            rightComponent={
              <Switch
                value={notifications?.topics[NotificationTopic.PURCHASED]}
                onValueChange={() => toggleTopic(NotificationTopic.PURCHASED)}
              />
            }
            size={52}
            titleComponent={
              <MenuItem.Title
                text={lang.t('settings.notifications_section.purchased')}
              />
            }
          />
          <MenuItem
            disabled
            hasSfSymbol
            leftComponent={
              <MenuItem.TextIcon colorOverride={colors.orange} icon="􀋡" />
            }
            rightComponent={
              <Switch
                value={notifications?.topics[NotificationTopic.SOLD]}
                onValueChange={() => toggleTopic(NotificationTopic.SOLD)}
              />
            }
            size={52}
            titleComponent={
              <MenuItem.Title
                text={lang.t('settings.notifications_section.sold')}
              />
            }
          />
          <MenuItem
            disabled
            hasSfSymbol
            leftComponent={
              <MenuItem.TextIcon colorOverride={colors.yellowOrange} icon="􀆿" />
            }
            rightComponent={
              <Switch
                value={notifications?.topics[NotificationTopic.MINTED]}
                onValueChange={() => toggleTopic(NotificationTopic.MINTED)}
              />
            }
            size={52}
            titleComponent={
              <MenuItem.Title
                text={lang.t('settings.notifications_section.minted')}
              />
            }
          />
          <MenuItem
            disabled
            hasSfSymbol
            leftComponent={
              <MenuItem.TextIcon colorOverride={colors.swapPurple} icon="􀖅" />
            }
            rightComponent={
              <Switch
                value={notifications?.topics[NotificationTopic.SWAPPED]}
                onValueChange={() => toggleTopic(NotificationTopic.SWAPPED)}
              />
            }
            size={52}
            titleComponent={
              <MenuItem.Title
                text={lang.t('settings.notifications_section.swapped')}
              />
            }
          />
          <MenuItem
            disabled
            hasSfSymbol
            leftComponent={
              <MenuItem.TextIcon colorOverride={colors.green} icon="􀁢" />
            }
            rightComponent={
              <Switch
                value={notifications?.topics[NotificationTopic.APPROVALS]}
                onValueChange={() => toggleTopic(NotificationTopic.APPROVALS)}
              />
            }
            size={52}
            titleComponent={
              <MenuItem.Title
                text={lang.t('settings.notifications_section.approvals')}
              />
            }
          />
          <MenuItem
            disabled
            hasSfSymbol
            leftComponent={
              <MenuItem.TextIcon
                colorOverride={colors.blueGreyDark60}
                icon="􀍡"
              />
            }
            rightComponent={
              <Switch
                value={notifications?.topics[NotificationTopic.OTHER]}
                onValueChange={() => toggleTopic(NotificationTopic.OTHER)}
              />
            }
            size={52}
            titleComponent={
              <MenuItem.Title
                text={lang.t('settings.notifications_section.other')}
              />
            }
          />
        </Menu>
      </Animated.View>
    </MenuContainer>
  );
};

export default WalletNotificationsSettings;
