import React, { useCallback, useState } from 'react';
import { haptics } from '@/utils';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { AccentColorProvider, Box, ColorModeProvider, Text, globalColors, useColorMode, useForegroundColor } from '@/design-system';
import { GlobalNotificationTopic } from '@/notifications/settings/constants';
import { useNetInfo } from '@react-native-community/netinfo';
import { showNotificationSubscriptionErrorAlert, showOfflineAlert } from '@/screens/SettingsSheet/components/notificationAlerts';
import { useAllNotificationSettingsFromStorage } from '@/notifications/settings';
import { toggleGlobalNotificationTopic } from '@/notifications/settings/settings';
import { setAllGlobalNotificationSettingsToStorage } from '@/notifications/settings/storage';
import { IS_ANDROID } from '@/env';
import Spinner from '@/components/Spinner';
import ActivityIndicator from '@/components/ActivityIndicator';
import * as i18n from '@/languages';
import { opacity } from '@/__swaps__/utils/swaps';

const LoadingSpinner = IS_ANDROID ? Spinner : ActivityIndicator;

export const NotificationToggleContextMenu = () => {
  const { colorMode, isDarkMode } = useColorMode();
  const { isConnected } = useNetInfo();
  const { globalNotificationSettings } = useAllNotificationSettingsFromStorage();

  const separatorSecondary = useForegroundColor('separatorSecondary');
  const separatorTertiary = useForegroundColor('separatorTertiary');

  const [topicSubscriptionInProgress, setTopicSubscriptionInProgress] = useState<boolean>(false);

  const toggleNotifications = useCallback(() => {
    if (!isConnected) {
      showOfflineAlert();
      return;
    }
    setTopicSubscriptionInProgress(true);
    toggleGlobalNotificationTopic(GlobalNotificationTopic.POINTS, !globalNotificationSettings[GlobalNotificationTopic.POINTS])
      .then(() => {
        setAllGlobalNotificationSettingsToStorage({
          ...globalNotificationSettings,
          [GlobalNotificationTopic.POINTS]: !globalNotificationSettings[GlobalNotificationTopic.POINTS],
        });
      })
      .catch(() => {
        showNotificationSubscriptionErrorAlert();
      })
      .finally(() => {
        setTopicSubscriptionInProgress(false);
      });
  }, [globalNotificationSettings, isConnected]);

  const menuConfig = {
    menuTitle: '',
    menuItems: [
      {
        actionKey: 'toggle',
        actionTitle: globalNotificationSettings[GlobalNotificationTopic.POINTS]
          ? i18n.t(i18n.l.points.notifications.disable)
          : i18n.t(i18n.l.points.notifications.enable),
      },
    ],
  };

  const onPressMenuItem = useCallback(() => {
    haptics.selection();
    toggleNotifications();
  }, [toggleNotifications]);

  return (
    <AccentColorProvider color={isDarkMode ? separatorSecondary : separatorTertiary}>
      <ContextMenuButton menuConfig={menuConfig} onPressMenuItem={onPressMenuItem}>
        <Box
          background="accent"
          style={{
            width: 36,
            height: 36,
            borderWidth: 1,
            borderColor: isDarkMode ? opacity(separatorTertiary, 0.025) : separatorTertiary,
          }}
          alignItems="center"
          justifyContent="center"
          borderRadius={18}
        >
          <ColorModeProvider value={colorMode}>
            {!topicSubscriptionInProgress ? (
              <Text size="icon 17px" weight="heavy" color="label" align="center">
                {globalNotificationSettings[GlobalNotificationTopic.POINTS] ? '􀋚' : '􀋞'}
              </Text>
            ) : (
              <LoadingSpinner color={isDarkMode ? globalColors.white100 : globalColors.grey100} size={20} />
            )}
          </ColorModeProvider>
        </Box>
      </ContextMenuButton>
    </AccentColorProvider>
  );
};
