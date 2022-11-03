import lang from 'i18n-js';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Switch } from 'react-native';
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
  NotificationTopicType,
  toggleGroupNotifications,
  toggleTopicForWallet,
  useNotificationSettings,
  useWalletGroupNotificationSettings,
} from '@/notifications/settings';
import { NotificationLoadingIndicator } from '@/components/settings-menu/NotificationLoadingIndicator';
import {
  showNotificationSubscriptionErrorAlert,
  showOfflineAlert,
} from '@/components/settings-menu/notificationAlerts';
import { useNetInfo } from '@react-native-community/netinfo';

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
  const { isConnected } = useNetInfo();

  const {
    lastOwnedWalletEnabled,
    lastWatchedWalletEnabled,
    ownerEnabled,
    updateSectionSettings,
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
    notifications.type,
    notifications.enabled,
    ownerEnabled,
    watcherEnabled,
    lastOwnedWalletEnabled,
    lastWatchedWalletEnabled,
  ]);

  const [allState, setAllState] = useState({
    loading: false,
    status: notificationsEnabled,
  });
  const setAllLoading = (loading: boolean) =>
    setAllState(prev => ({ ...prev, loading }));

  const [topicState, setTopicState] = useState({ ...notifications.topics });
  const toggleStateForTopic = (topic: NotificationTopicType) =>
    setTopicState(prev => ({ ...prev, [topic]: !prev[topic] }));

  const [
    topicSubscriptionInProgress,
    setTopicSubscriptionInProgress,
  ] = useState<NotificationTopicType | null>(null);

  const toggleAllowNotifications = useCallback(() => {
    if (!isConnected) {
      showOfflineAlert();
      return;
    }
    setAllState(prev => ({ status: !prev.status, loading: true }));
    toggleGroupNotifications(
      [notifications],
      notifications.type,
      !notificationsEnabled
    )
      .then(() => {
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
        setAllLoading(false);
      })
      .catch(() => {
        showNotificationSubscriptionErrorAlert();
        setAllState(prev => ({ status: !prev.status, loading: false }));
      });
  }, [
    notificationsSectionEnabled,
    lastWalletEnabled,
    updateSettings,
    notificationsEnabled,
    notifications,
    updateSectionSettings,
  ]);

  const toggleTopic = useCallback(
    (topic: NotificationTopicType) => {
      if (!isConnected) {
        showOfflineAlert();
        return;
      }
      toggleStateForTopic(topic);
      setTopicSubscriptionInProgress(topic);
      toggleTopicForWallet(
        notifications.type,
        notifications.address,
        topic,
        !notifications?.topics[topic]
      )
        .then(() => {
          updateSettings({
            topics: {
              ...notifications.topics,
              [topic]: !notifications?.topics[topic],
            },
          });
        })
        .catch(() => {
          showNotificationSubscriptionErrorAlert();
          toggleStateForTopic(topic);
        })
        .finally(() => {
          setTopicSubscriptionInProgress(null);
        });
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
            <NotificationLoadingIndicator />
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
              {allState.loading && <NotificationLoadingIndicator />}
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
          <IndividualTopicItemRow
            topic={NotificationTopic.SENT}
            icon="􀈟"
            iconColor={colors.appleBlue}
            text={lang.t('settings.notifications_section.sent')}
          />
          <IndividualTopicItemRow
            topic={NotificationTopic.RECEIVED}
            icon="􀅀"
            iconColor={colors.green}
            text={lang.t('settings.notifications_section.received')}
          />
          <IndividualTopicItemRow
            topic={NotificationTopic.PURCHASED}
            icon="􀑉"
            iconColor={colors.green}
            text={lang.t('settings.notifications_section.purchased')}
          />
          <IndividualTopicItemRow
            topic={NotificationTopic.SOLD}
            icon="􀋡"
            iconColor={colors.orange}
            text={lang.t('settings.notifications_section.sold')}
          />
          <IndividualTopicItemRow
            topic={NotificationTopic.MINTED}
            icon="􀆿"
            iconColor={colors.yellowOrange}
            text={lang.t('settings.notifications_section.minted')}
          />
          <IndividualTopicItemRow
            topic={NotificationTopic.SWAPPED}
            icon="􀖅"
            iconColor={colors.swapPurple}
            text={lang.t('settings.notifications_section.swapped')}
          />
          <IndividualTopicItemRow
            topic={NotificationTopic.APPROVALS}
            icon="􀁢"
            iconColor={colors.green}
            text={lang.t('settings.notifications_section.approvals')}
          />
          <IndividualTopicItemRow
            topic={NotificationTopic.OTHER}
            icon="􀍡"
            iconColor={colors.blueGreyDark60}
            text={lang.t('settings.notifications_section.other')}
          />
        </Menu>
      </Animated.View>
    </MenuContainer>
  );
};

export default WalletNotificationsSettings;
