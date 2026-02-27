import MaskedView from '@react-native-masked-view/masked-view';
import React, { useCallback } from 'react';
import { ImageBackground, StyleSheet, Image, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SystemBars } from 'react-native-edge-to-edge';
import { Box, Stack, Text, Bleed, Column, Columns, ColorModeProvider } from '@/design-system';
import { IS_ANDROID, IS_IOS } from '@/env';
import { useHardwareBackOnFocus } from '@/hooks/useHardwareBack';
import * as i18n from '@/languages';
import { Navigation, useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { isNotificationPermissionGranted, requestNotificationPermission } from '@/notifications/permissions';
import { useTheme } from '@/theme';
import backgroundImage from '@/assets/notificationsPromoSheetBackground.png';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import mockNotificationsIOS from '@/assets/mockNotificationsIOS.png';
import mockNotificationsAndroid from '@/assets/mockNotificationsAndroid.png';
import { analytics } from '@/analytics';
import { event } from '@/analytics/event';

const TRANSLATIONS = i18n.l.promos.notifications_launch;

export function NotificationPermissionScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const { goBack } = useNavigation();

  const valuePropItems = [
    {
      title: i18n.t(TRANSLATIONS.info_row_1.title),
      description: i18n.t(TRANSLATIONS.info_row_1.description),
      icon: '􀋚',
    },
    {
      title: i18n.t(TRANSLATIONS.info_row_2.title),
      description: i18n.t(TRANSLATIONS.info_row_2.description),
      icon: '􀋦',
    },
    {
      title: i18n.t(TRANSLATIONS.info_row_3.title),
      description: i18n.t(TRANSLATIONS.info_row_3.description),
      icon: '􀜊',
    },
  ];

  const headerImage = IS_IOS ? mockNotificationsIOS : mockNotificationsAndroid;

  const navigateToWallet = useCallback(() => {
    goBack();
    Navigation.handleAction(Routes.SWIPE_LAYOUT, { screen: Routes.WALLET_SCREEN });
  }, [goBack]);

  const handleDismiss = useCallback(() => {
    analytics.track(event.notificationPermissionSkipped);
    navigateToWallet();
  }, [navigateToWallet]);

  useHardwareBackOnFocus(() => true, !IS_ANDROID);

  const handleEnable = useCallback(async () => {
    try {
      analytics.track(event.notificationPermissionRequested);
      const status = await requestNotificationPermission();
      if (isNotificationPermissionGranted(status)) {
        analytics.track(event.notificationPermissionGranted);
      } else {
        analytics.track(event.notificationPermissionDenied);
      }
    } finally {
      navigateToWallet();
    }
  }, [navigateToWallet]);

  return (
    <ColorModeProvider value="dark">
      <View style={styles.container} testID="notification-permission-screen">
        <SystemBars style="light" />
        <Box as={ImageBackground} height="full" source={backgroundImage} style={StyleSheet.absoluteFillObject} />
        <Box paddingTop={{ custom: 57.5 }} paddingBottom={{ custom: safeAreaInsets.bottom }} style={styles.flex}>
          <Image source={headerImage} style={styles.headerImage} resizeMode="contain" />
          <Box alignItems="center" paddingHorizontal="20px" paddingTop={'44px'} paddingBottom={{ custom: 64 }}>
            <Text color="label" align="center" size="30pt" weight="heavy">
              {i18n.t(TRANSLATIONS.header)}
            </Text>
          </Box>
          <Box gap={38} paddingHorizontal={'32px'}>
            {valuePropItems.map(item => (
              <ValuePropItem key={item.title} title={item.title} description={item.description} icon={item.icon} />
            ))}
          </Box>
          <Box flexGrow={1} justifyContent="flex-end" gap={24} paddingHorizontal="20px" paddingVertical={'24px'}>
            <ButtonPressAnimation onPress={handleEnable} testID="notification-permission-enable-button">
              <Box
                height={48}
                background="white"
                borderRadius={24}
                paddingHorizontal="20px"
                paddingVertical="12px"
                justifyContent="center"
                alignItems="center"
              >
                <Text color="black" size="22pt" weight="heavy">
                  {i18n.t(TRANSLATIONS.primary_button.permissions_not_enabled)}
                </Text>
              </Box>
            </ButtonPressAnimation>
            <ButtonPressAnimation onPress={handleDismiss} testID="notification-permission-dismiss-button">
              <Text color="labelTertiary" size="17pt" weight="heavy" align="center">
                {i18n.t(TRANSLATIONS.secondary_button)}
              </Text>
            </ButtonPressAnimation>
          </Box>
        </Box>
      </View>
    </ColorModeProvider>
  );
}

const ValuePropItem = ({ title, description, icon }: { title: string; description: string; icon: string }) => {
  const { colors } = useTheme();
  return (
    <Columns space={{ custom: 13 }}>
      <Column width="content">
        <MaskedView
          maskElement={
            <Box paddingTop={IS_ANDROID ? '6px' : undefined}>
              <Text align="center" color="accent" size="30pt" weight="bold">
                {icon}
              </Text>
            </Box>
          }
          style={{ width: 42 }}
        >
          <Box
            as={LinearGradient}
            colors={colors.gradients.appleBlueTintToAppleBlue}
            end={{ x: 0.5, y: 1 }}
            height={{ custom: 50 }}
            marginTop="-10px"
            start={{ x: 0, y: 0 }}
            width="full"
          />
        </MaskedView>
      </Column>
      <Bleed top="3px">
        <Stack space="12px">
          <Text color="label" size="17pt" weight="bold">
            {title}
          </Text>
          <Text color="labelSecondary" size="15pt / 150%" weight="medium">
            {description}
          </Text>
        </Stack>
      </Bleed>
    </Columns>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...(IS_ANDROID && {
      borderTopLeftRadius: 40,
      borderTopRightRadius: 40,
      overflow: 'hidden',
    }),
  },
  flex: {
    flex: 1,
  },
  headerImage: {
    height: 150,
    alignSelf: 'center',
  },
});
