import React, { useCallback, useState } from 'react';
import { haptics } from '@/utils';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import {
  AccentColorProvider,
  Box,
  ColorModeProvider,
  Text,
  globalColors,
  useColorMode,
  useForegroundColor,
} from '@/design-system';
import { GlobalNotificationTopic } from '@/notifications/settings/constants';
import { useNetInfo } from '@react-native-community/netinfo';
import {
  showNotificationSubscriptionErrorAlert,
  showOfflineAlert,
} from '@/screens/SettingsSheet/components/notificationAlerts';
import { useAllNotificationSettingsFromStorage } from '@/notifications/settings';
import {
  GlobalNotificationTopicType,
  GlobalNotificationTopics,
} from '@/notifications/settings/types';
import { toggleGlobalNotificationTopic } from '@/notifications/settings/settings';
import { setAllGlobalNotificationSettingsToStorage } from '@/notifications/settings/storage';
import { IS_ANDROID } from '@/env';
import Spinner from '@/components/Spinner';
import ActivityIndicator from '@/components/ActivityIndicator';

const LoadingSpinner = IS_ANDROID ? Spinner : ActivityIndicator;

export const NotificationToggleContextMenu = () => {
  const separatorTertiary = useForegroundColor('separatorTertiary');
  const { colorMode } = useColorMode();
  const { isConnected } = useNetInfo();
  const {
    globalNotificationSettings,
  } = useAllNotificationSettingsFromStorage();

  const [topicState, setTopicState] = useState<GlobalNotificationTopics>(
    globalNotificationSettings
  );

  const toggleStateForTopic = (topic: GlobalNotificationTopicType) =>
    setTopicState(prev => ({ ...prev, [topic]: !prev[topic] }));

  const [
    topicSubscriptionInProgress,
    setTopicSubscriptionInProgress,
  ] = useState<boolean>(false);

  const toggleNotifications = useCallback(() => {
    if (!isConnected) {
      showOfflineAlert();
      return;
    }
    toggleStateForTopic(GlobalNotificationTopic.POINTS);
    setTopicSubscriptionInProgress(true);
    toggleGlobalNotificationTopic(
      GlobalNotificationTopic.POINTS,
      !globalNotificationSettings[GlobalNotificationTopic.POINTS]
    )
      .then(() => {
        setAllGlobalNotificationSettingsToStorage({
          ...topicState,
          [GlobalNotificationTopic.POINTS]: !topicState[
            GlobalNotificationTopic.POINTS
          ],
        });
      })
      .catch(() => {
        showNotificationSubscriptionErrorAlert();
        toggleStateForTopic(GlobalNotificationTopic.POINTS);
      })
      .finally(() => {
        setTopicSubscriptionInProgress(false);
      });
  }, [globalNotificationSettings, isConnected, topicState]);

  const menuConfig = {
    menuTitle: '',
    menuItems: [
      {
        actionKey: 'toggle',
        actionTitle: topicState[GlobalNotificationTopic.POINTS]
          ? 'Disable Points Notifications'
          : 'Enable Points Notifications',
      },
    ],
  };

  const onPressMenuItem = useCallback(() => {
    haptics.selection();
    toggleNotifications();
  }, [toggleNotifications]);

  return (
    <AccentColorProvider color={separatorTertiary}>
      <ContextMenuButton
        menuConfig={menuConfig}
        onPressMenuItem={onPressMenuItem}
      >
        <Box
          background="accent"
          style={{
            width: 36,
            height: 36,
            borderWidth: 1,
            borderColor: separatorTertiary,
          }}
          alignItems="center"
          justifyContent="center"
          borderRadius={18}
        >
          <ColorModeProvider value={colorMode}>
            {!topicSubscriptionInProgress ? (
              <Text size="17pt" weight="heavy" color="label" align="center">
                {topicState[GlobalNotificationTopic.POINTS] ? '􀋚' : '􀋞'}
              </Text>
            ) : (
              <LoadingSpinner
                color={
                  colorMode === 'dark'
                    ? globalColors.white100
                    : globalColors.grey100
                }
                size={20}
              />
            )}
          </ColorModeProvider>
        </Box>
      </ContextMenuButton>
    </AccentColorProvider>
  );
};
