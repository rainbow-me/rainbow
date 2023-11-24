import lang from 'i18n-js';
import React, { useCallback, useMemo, useState } from 'react';
import { Switch } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import Menu from './Menu';
import MenuContainer from './MenuContainer';
import MenuItem from './MenuItem';
import { ThemeContextProps, useTheme } from '@/theme';
import { RouteProp, useRoute } from '@react-navigation/native';
import {
  NotificationRelationship,
  NotificationTopic,
  NotificationTopicType,
  updateGroupSettings,
  useWalletGroupNotificationSettings,
  WalletNotificationSettings,
} from '@/notifications/settings';
import {
  toggleGroupNotifications,
  toggleTopicForWallet,
} from '@/notifications/settings/settings';
import { SettingsLoadingIndicator } from '@/screens/SettingsSheet/components/SettingsLoadingIndicator';
import {
  showNotificationSubscriptionErrorAlert,
  showOfflineAlert,
} from '@/screens/SettingsSheet/components/notificationAlerts';
import { useNetInfo } from '@react-native-community/netinfo';

const makeTopicRowsData = (colors: ThemeContextProps['colors']) => [
  {
    topic: NotificationTopic.SENT,
    icon: '􀈟',
    iconColor: colors.appleBlue,
    text: lang.t('settings.notifications_section.sent'),
  },
  {
    topic: NotificationTopic.RECEIVED,
    icon: '􀅀',
    iconColor: colors.green,
    text: lang.t('settings.notifications_section.received'),
  },
  {
    topic: NotificationTopic.PURCHASED,
    icon: '􀑉',
    iconColor: colors.pink,

    text: lang.t('settings.notifications_section.purchased'),
  },
  {
    topic: NotificationTopic.SOLD,
    icon: '􀋡',
    iconColor: colors.orange,
    text: lang.t('settings.notifications_section.sold'),
  },
  {
    topic: NotificationTopic.MINTED,
    icon: '􀆿',
    iconColor: colors.yellowOrange,
    text: lang.t('settings.notifications_section.minted'),
  },
  {
    topic: NotificationTopic.SWAPPED,
    icon: '􀖅',
    iconColor: colors.swapPurple,
    text: lang.t('settings.notifications_section.swapped'),
  },
  {
    topic: NotificationTopic.APPROVALS,
    icon: '􀁢',
    iconColor: colors.green,
    text: lang.t('settings.notifications_section.approvals'),
  },
  {
    topic: NotificationTopic.OTHER,
    icon: '􀍡',
    iconColor: colors.blueGreyDark60,
    text: lang.t('settings.notifications_section.other'),
  },
];

type RouteParams = {
  WalletNotificationsSettings: {
    address: string;
    notificationSettings: WalletNotificationSettings;
  };
};

const WalletNotificationsSettings = () => {
  const { colors } = useTheme();
  const topicRowsData = useMemo(() => makeTopicRowsData(colors), [colors]);
  const route = useRoute<
    RouteProp<RouteParams, 'WalletNotificationsSettings'>
  >();
  const { isConnected } = useNetInfo();
  const { address, notificationSettings } = route.params;

  const [
    notifications,
    setNotificationSettings,
  ] = useState<WalletNotificationSettings>(notificationSettings);

  const updateSettings = useCallback(
    (options: Partial<WalletNotificationSettings>) => {
      const newSettingsForWallet = {
        ...notifications,
        ...options,
      };
      setNotificationSettings(newSettingsForWallet);
    },
    [address, notifications]
  );

  const {
    lastOwnedWalletEnabled,
    lastWatchedWalletEnabled,
    ownerEnabled,
    watcherEnabled,
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
    notifications,
    ownerEnabled,
    watcherEnabled,
    lastOwnedWalletEnabled,
    lastWatchedWalletEnabled,
  ]);

  const [allState, setAllState] = useState({
    loading: false,
    status: notificationsEnabled,
  });

  const [topicState, setTopicState] = useState({
    ...(notifications?.topics ?? {}),
  });
  const toggleStateForTopic = (topic: NotificationTopicType) =>
    setTopicState(prev => ({ ...prev, [topic]: !prev[topic] }));

  // We allow only one subscription in progress
  // this states controls which we are currently updating
  const [
    topicSubscriptionInProgress,
    setTopicSubscriptionInProgress,
  ] = useState<NotificationTopicType | null>(null);

  const toggleAllowNotifications = useCallback(async () => {
    if (!isConnected) {
      showOfflineAlert();
      return;
    }
    setAllState(prev => ({ status: !prev.status, loading: true }));
    const success = await toggleGroupNotifications(
      [notifications],
      !notificationsEnabled
    );
    if (success) {
      if (
        !notificationsSectionEnabled ||
        (notificationsSectionEnabled && lastWalletEnabled)
      ) {
        updateGroupSettings({
          [notifications.type]: !notificationsEnabled,
        });
      }
      updateSettings({
        enabled: !notificationsEnabled,
      });
      setAllState(prev => ({ ...prev, loading: false }));
    } else {
      showNotificationSubscriptionErrorAlert();
      setAllState(prev => ({ status: !prev.status, loading: false }));
    }
  }, [
    notificationsSectionEnabled,
    lastWalletEnabled,
    updateSettings,
    notificationsEnabled,
    notifications,
    isConnected,
  ]);

  const toggleTopic = useCallback(
    async (topic: NotificationTopicType) => {
      if (!isConnected) {
        showOfflineAlert();
        return;
      }
      toggleStateForTopic(topic);
      setTopicSubscriptionInProgress(topic);
      const success = await toggleTopicForWallet(
        notifications.address,
        topic,
        !notifications?.topics[topic]
      );
      if (success) {
        updateSettings({
          topics: {
            ...notifications.topics,
            [topic]: !notifications?.topics[topic],
          },
        });
      } else {
        showNotificationSubscriptionErrorAlert();
        toggleStateForTopic(topic);
      }
      setTopicSubscriptionInProgress(null);
    },
    [notifications, updateSettings, isConnected]
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

  const IndividualTopicItemRow = ({
    topic,
    icon,
    iconColor,
    text,
  }: {
    topic: NotificationTopicType;
    icon: string;
    iconColor: string;
    text: string;
  }) => (
    <MenuItem
      disabled
      hasSfSymbol
      leftComponent={
        <MenuItem.TextIcon colorOverride={iconColor} icon={icon} />
      }
      rightComponent={
        <>
          {topicSubscriptionInProgress === topic && (
            <SettingsLoadingIndicator />
          )}
          <Switch
            disabled={allState.loading || topicSubscriptionInProgress !== null}
            value={topicState[topic]}
            onValueChange={() => toggleTopic(topic)}
          />
        </>
      }
      size={52}
      titleComponent={<MenuItem.Title text={text} />}
    />
  );

  return (
    <MenuContainer>
      <Menu>
        <MenuItem
          disabled
          rightComponent={
            <>
              {allState.loading && <SettingsLoadingIndicator />}
              <Switch
                disabled={
                  allState.loading || topicSubscriptionInProgress !== null
                }
                onValueChange={toggleAllowNotifications}
                value={allState.status}
              />
            </>
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
          {topicRowsData.map(({ topic, icon, iconColor, text }) => (
            <IndividualTopicItemRow
              key={topic}
              topic={topic}
              icon={icon}
              iconColor={iconColor}
              text={text}
            />
          ))}
        </Menu>
      </Animated.View>
    </MenuContainer>
  );
};

export default WalletNotificationsSettings;
