import React from 'react';
import * as perms from 'react-native-permissions';

import useAppState from '@/hooks/useAppState';
import { useNavigation } from '@/navigation/Navigation';
import { CampaignKey } from '@/components/remote-promo-sheet/localCampaignChecks';
import { PromoSheet } from '@/components/PromoSheet';
import backgroundImage from '@/assets/notificationsPromoSheetBackground.png';
import headerImageIOS from '@/assets/notificationsPromoSheetHeaderIOS.png';
import headerImageAndroid from '@/assets/notificationsPromoSheetHeaderAndroid.png';
import { delay } from '@/helpers/utilities';
import Routes from '@/navigation/routesNames';
import { useTheme } from '@/theme';
import * as i18n from '@/languages';
import { IS_IOS } from '@/env';
import { logger, RainbowError } from '@/logger';
import { analyticsV2 } from '@/analytics';

const HEADER_HEIGHT = 255;
const HEADER_WIDTH = 390;
const TRANSLATIONS = i18n.l.promos.notifications_launch;

export function NotificationsPromoSheetInner({
  permissions,
  requestNotificationPermissions,
}: {
  permissions: perms.NotificationsResponse;
  requestNotificationPermissions: () => Promise<perms.NotificationsResponse>;
}) {
  const { colors } = useTheme();
  const { goBack, navigate } = useNavigation();

  const { status, settings } = permissions;
  /**
   * Android doesn't return settings, so only useful on iOS
   * @see https://github.com/zoontek/react-native-permissions#checknotifications
   */
  const hasSettingsEnabled = !IS_IOS || Boolean(Object.values(settings).find(s => Boolean(s)));
  const notificationsEnabled = status === perms.RESULTS.GRANTED;
  const notificationsDenied = status === perms.RESULTS.DENIED;
  const notificationsBlocked = status === perms.RESULTS.BLOCKED;

  React.useEffect(() => {
    analyticsV2.track(analyticsV2.event.notificationsPromoShown);
    return () => {
      analyticsV2.track(analyticsV2.event.notificationsPromoDismissed);
    };
  }, []);

  const navigateToNotifications = React.useCallback(() => {
    goBack();
    delay(300).then(() => {
      navigate(Routes.SETTINGS_SHEET);
      delay(300).then(() =>
        navigate(Routes.SETTINGS_SHEET, {
          screen: 'NotificationsSection',
        })
      );
    });
  }, [goBack, navigate]);

  const primaryButtonOnPress = React.useCallback(async () => {
    if (notificationsDenied) {
      logger.debug(`NotificationsPromoSheet: notifications permissions denied (could be default state)`);
      const result = await requestNotificationPermissions();
      if (result.status === perms.RESULTS.BLOCKED) {
        analyticsV2.track(analyticsV2.event.notificationsPromoPermissionsBlocked);
        goBack();
      } else if (result.status === perms.RESULTS.GRANTED) {
        // only happens on iOS, Android is enabled by default
        analyticsV2.track(analyticsV2.event.notificationsPromoPermissionsGranted);
      }
    } else if (!hasSettingsEnabled || notificationsBlocked) {
      logger.debug(`NotificationsPromoSheet: notifications permissions either blocked or all settings are disabled`);
      analyticsV2.track(analyticsV2.event.notificationsPromoSystemSettingsOpened);
      await perms.openSettings();
    } else if (notificationsEnabled) {
      logger.debug(`NotificationsPromoSheet: notifications permissions enabled`);
      analyticsV2.track(analyticsV2.event.notificationsPromoNotificationSettingsOpened);
      navigateToNotifications();
    } else {
      logger.error(new RainbowError(`NotificationsPromoSheet: reached invalid state`), {
        permissions,
      });
    }
  }, [goBack, permissions, hasSettingsEnabled, notificationsDenied, notificationsEnabled, notificationsBlocked, navigateToNotifications]);

  return (
    <PromoSheet
      accentColor={colors.whiteLabel}
      backgroundColor={colors.trueBlack}
      backgroundImage={backgroundImage}
      campaignKey={CampaignKey.notificationsLaunch}
      headerImage={IS_IOS ? headerImageIOS : headerImageAndroid}
      headerImageAspectRatio={HEADER_WIDTH / HEADER_HEIGHT}
      sheetHandleColor={colors.whiteLabel}
      header={i18n.t(TRANSLATIONS.header)}
      subHeader={i18n.t(TRANSLATIONS.subheader)}
      primaryButtonProps={{
        label:
          notificationsEnabled && hasSettingsEnabled
            ? `􀜊 ${i18n.t(TRANSLATIONS.primary_button.permissions_enabled)}`
            : `􀝖 ${i18n.t(TRANSLATIONS.primary_button.permissions_not_enabled)}`,
        onPress: primaryButtonOnPress,
      }}
      secondaryButtonProps={{
        label: i18n.t(TRANSLATIONS.secondary_button),
        onPress: goBack,
      }}
      items={[
        {
          title: i18n.t(TRANSLATIONS.info_row_1.title),
          description: i18n.t(TRANSLATIONS.info_row_1.title),
          icon: '􀖅',
          gradient: colors.gradients.appleBlueTintToAppleBlue,
        },
        {
          title: i18n.t(TRANSLATIONS.info_row_2.title),
          description: i18n.t(TRANSLATIONS.info_row_2.description),
          icon: '􀯮',
          gradient: colors.gradients.appleBlueTintToAppleBlue,
        },
        {
          title: i18n.t(TRANSLATIONS.info_row_3.title),
          description: i18n.t(TRANSLATIONS.info_row_3.description),
          icon: '􀙨',
          gradient: colors.gradients.appleBlueTintToAppleBlue,
        },
      ]}
    />
  );
}

export default function NotificationsPromoSheet() {
  const { justBecameActive } = useAppState();
  const [permissionsCheckResult, setPermissionsCheckResult] = React.useState<perms.NotificationsResponse>();

  const checkPermissions = React.useCallback(async () => {
    const result = await perms.checkNotifications();
    setPermissionsCheckResult(result);
  }, [setPermissionsCheckResult]);

  const requestNotificationPermissions = React.useCallback(async () => {
    const result = await perms.requestNotifications(['alert']);
    setPermissionsCheckResult(result);
    return result;
  }, [setPermissionsCheckResult]);

  // checks initially, then each time after app state becomes active
  React.useEffect(() => {
    checkPermissions();
  }, [justBecameActive, checkPermissions]);

  return permissionsCheckResult !== undefined ? (
    <NotificationsPromoSheetInner permissions={permissionsCheckResult} requestNotificationPermissions={requestNotificationPermissions} />
  ) : null;
}
