import React from 'react';
import * as perms from 'react-native-permissions';
import { isNotificationPermissionGranted, requestNotificationPermission } from '@/notifications/permissions';
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
  status,
  requestNotificationPermissions,
}: {
  status: perms.PermissionStatus;
  requestNotificationPermissions: () => Promise<perms.PermissionStatus>;
}) {
  const { colors } = useTheme();
  const { goBack, navigate } = useNavigation();

  const notificationsEnabled = isNotificationPermissionGranted(status);
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
      logger.debug(`[NotificationsPromoSheet]: notifications permissions denied (could be default state)`);
      const status = await requestNotificationPermissions();
      if (status === perms.RESULTS.BLOCKED) {
        analyticsV2.track(analyticsV2.event.notificationsPromoPermissionsBlocked);
        goBack();
      } else if (isNotificationPermissionGranted(status)) {
        analyticsV2.track(analyticsV2.event.notificationsPromoPermissionsGranted);
      }
    } else if (notificationsBlocked) {
      logger.debug(`[NotificationsPromoSheet]: notifications permissions blocked`);
      analyticsV2.track(analyticsV2.event.notificationsPromoSystemSettingsOpened);
      await perms.openSettings();
    } else if (notificationsEnabled) {
      logger.debug(`[NotificationsPromoSheet]: notifications permissions enabled`);
      analyticsV2.track(analyticsV2.event.notificationsPromoNotificationSettingsOpened);
      navigateToNotifications();
    } else {
      logger.error(new RainbowError(`NotificationsPromoSheet: reached invalid state`), {
        status,
      });
    }
  }, [notificationsDenied, notificationsBlocked, notificationsEnabled, requestNotificationPermissions, goBack, navigateToNotifications]);

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
        label: notificationsEnabled
          ? `􀜊 ${i18n.t(TRANSLATIONS.primary_button.permissions_enabled)}`
          : `􀝖 ${i18n.t(TRANSLATIONS.primary_button.permissions_not_enabled)}`,
        textColor: colors.trueBlack,
        onPress: primaryButtonOnPress,
      }}
      secondaryButtonProps={{
        label: i18n.t(TRANSLATIONS.secondary_button),
        textColor: colors.whiteLabel,
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
  const [permissionStatus, setPermissionStatus] = React.useState<perms.PermissionStatus>();

  const checkPermissions = React.useCallback(async () => {
    const result = await perms.checkNotifications();
    const { status } = result;
    setPermissionStatus(status);
  }, []);

  const requestNotificationPermissions = React.useCallback(async () => {
    const status = await requestNotificationPermission();
    setPermissionStatus(status);
    return status;
  }, []);

  // checks initially, then each time after app state becomes active
  React.useEffect(() => {
    checkPermissions();
  }, [justBecameActive, checkPermissions]);

  return permissionStatus !== undefined ? (
    <NotificationsPromoSheetInner status={permissionStatus} requestNotificationPermissions={requestNotificationPermissions} />
  ) : null;
}
