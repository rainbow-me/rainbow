import lang from 'i18n-js';
import React, { useCallback, useMemo, useState } from 'react';
import { Switch } from 'react-native';
import Animated, { Easing, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import Menu from './Menu';
import MenuContainer from './MenuContainer';
import MenuItem from './MenuItem';
import { ThemeContextProps, useTheme } from '@/theme';
import { RouteProp, useRoute } from '@react-navigation/native';
import {
  WalletNotificationRelationship,
  WalletNotificationTopic,
  WalletNotificationTopicType,
  updateGroupSettings,
  useWalletGroupNotificationSettings,
  WalletNotificationSettings,
} from '@/notifications/settings';
import { toggleGroupNotifications, toggleTopicForWallet } from '@/notifications/settings/settings';
import { SettingsLoadingIndicator } from '@/screens/SettingsSheet/components/SettingsLoadingIndicator';
import { showNotificationSubscriptionErrorAlert, showOfflineAlert } from '@/screens/SettingsSheet/components/notificationAlerts';
import { useNetInfo } from '@react-native-community/netinfo';
import { DEFAULT_ENABLED_TOPIC_SETTINGS } from '@/notifications/settings/constants';

const makeTopicRowsData = (colors: ThemeContextProps['colors']) => [
  {
    topic: WalletNotificationTopic.SENT,
    icon: '􀈟',
    iconColor: colors.appleBlue,
    text: lang.t('settings.notifications_section.sent'),
  },
  {
    topic: WalletNotificationTopic.RECEIVED,
    icon: '􀅀',
    iconColor: colors.green,
    text: lang.t('settings.notifications_section.received'),
  },
  {
    topic: WalletNotificationTopic.PURCHASED,
    icon: '􀑉',
    iconColor: colors.pink,

    text: lang.t('settings.notifications_section.purchased'),
  },
  {
    topic: WalletNotificationTopic.SOLD,
    icon: '􀋡',
    iconColor: colors.orange,
    text: lang.t('settings.notifications_section.sold'),
  },
  {
    topic: WalletNotificationTopic.MINTED,
    icon: '􀆿',
    iconColor: colors.yellowOrange,
    text: lang.t('settings.notifications_section.minted'),
  },
  {
    topic: WalletNotificationTopic.SWAPPED,
    icon: '􀖅',
    iconColor: colors.swapPurple,
    text: lang.t('settings.notifications_section.swapped'),
  },
  {
    topic: WalletNotificationTopic.APPROVALS,
    icon: '􀁢',
    iconColor: colors.green,
    text: lang.t('settings.notifications_section.approvals'),
  },
  {
    topic: WalletNotificationTopic.OTHER,
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
  const route = useRoute<RouteProp<RouteParams, 'WalletNotificationsSettings'>>();
  const { isConnected } = useNetInfo();
  const { address, notificationSettings } = route.params;

  const [notifications, setNotificationSettings] = useState<WalletNotificationSettings>(notificationSettings);
  const updateSettings = useCallback(
    (options: Partial<WalletNotificationSettings>) => {
      const newSettingsForWallet = {
        ...notifications,
        ...options,
      };
      setNotificationSettings(newSettingsForWallet);
      setTopicState(newSettingsForWallet.topics);
    },
    [address, notifications]
  );

  const { lastOwnedWalletEnabled, lastWatchedWalletEnabled, ownerEnabled, watcherEnabled } = useWalletGroupNotificationSettings();

  const { notificationsEnabled, notificationsSectionEnabled, lastWalletEnabled } = useMemo(() => {
    const ownedWallet = notifications.type === WalletNotificationRelationship.OWNER;
    const notificationsSectionEnabled = ownedWallet ? ownerEnabled : watcherEnabled;
    const lastWalletEnabled = ownedWallet ? lastOwnedWalletEnabled : lastWatchedWalletEnabled;
    return {
      notificationsEnabled: notifications.enabled,
      notificationsSectionEnabled,
      lastWalletEnabled,
    };
  }, [notifications, ownerEnabled, watcherEnabled, lastOwnedWalletEnabled, lastWatchedWalletEnabled]);

  const [allState, setAllState] = useState({
    loading: false,
    status: notificationsEnabled,
  });

  const [topicState, setTopicState] = useState({
    ...(notifications?.topics ?? {}),
  });
  const toggleStateForTopic = (topic: WalletNotificationTopicType) => setTopicState(prev => ({ ...prev, [topic]: !prev[topic] }));

  // We allow only one subscription in progress
  // this states controls which we are currently updating
  const [topicSubscriptionInProgress, setTopicSubscriptionInProgress] = useState<WalletNotificationTopicType | null>(null);

  const toggleAllowNotifications = useCallback(async () => {
    if (!isConnected) {
      showOfflineAlert();
      return;
    }
    setAllState(prev => ({ status: !prev.status, loading: true }));
    const success = await toggleGroupNotifications([notifications], !notificationsEnabled);
    if (success) {
      if (!notificationsSectionEnabled || (notificationsSectionEnabled && lastWalletEnabled)) {
        updateGroupSettings({
          [notifications.type]: !notificationsEnabled,
        });
      }
      updateSettings({
        enabled: !notificationsEnabled,
        topics: notificationsEnabled ? {} : DEFAULT_ENABLED_TOPIC_SETTINGS,
      });
      setAllState(prev => ({ ...prev, loading: false }));
    } else {
      showNotificationSubscriptionErrorAlert();
      setAllState(prev => ({ status: !prev.status, loading: false }));
    }
  }, [notificationsSectionEnabled, lastWalletEnabled, updateSettings, notificationsEnabled, notifications, isConnected]);

  const toggleTopic = useCallback(
    async (topic: WalletNotificationTopicType) => {
      if (!isConnected) {
        showOfflineAlert();
        return;
      }
      toggleStateForTopic(topic);
      setTopicSubscriptionInProgress(topic);
      const success = await toggleTopicForWallet(notifications.address, topic, !notifications?.topics[topic]);
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
    topic: WalletNotificationTopicType;
    icon: string;
    iconColor: string;
    text: string;
  }) => (
    <MenuItem
      disabled
      hasSfSymbol
      leftComponent={<MenuItem.TextIcon colorOverride={iconColor} icon={icon} />}
      rightComponent={
        <>
          {topicSubscriptionInProgress === topic && <SettingsLoadingIndicator />}
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
                disabled={allState.loading || topicSubscriptionInProgress !== null}
                onValueChange={toggleAllowNotifications}
                value={allState.status}
              />
            </>
          }
          size={52}
          titleComponent={<MenuItem.Title text={lang.t('settings.notifications_section.allow_notifications')} weight="bold" />}
        />
      </Menu>
      <Animated.View style={animatedStyle}>
        <Menu>
          {topicRowsData.map(({ topic, icon, iconColor, text }) => (
            <IndividualTopicItemRow key={topic} topic={topic} icon={icon} iconColor={iconColor} text={text} />
          ))}
        </Menu>
      </Animated.View>
    </MenuContainer>
  );
};

export default WalletNotificationsSettings;
