import { Alert } from 'react-native';
import lang from 'i18n-js';

export function showNotificationSubscriptionErrorAlert() {
  Alert.alert(
    lang.t('settings.notifications_section.error_alert_title'),
    lang.t('settings.notifications_section.error_alert_content'),
    [{ text: 'OK' }]
  );
}
