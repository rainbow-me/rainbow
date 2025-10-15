import { Alert } from 'react-native';
import i18n from '@/languages';

export function showNotificationSubscriptionErrorAlert() {
  Alert.alert(i18n.settings.notifications_section.error_alert_title(), i18n.settings.notifications_section.error_alert_content(), [
    { text: i18n.button.ok() },
  ]);
}
export function showOfflineAlert() {
  Alert.alert(i18n.settings.notifications_section.error_alert_title(), i18n.settings.notifications_section.offline_alert_content(), [
    { text: i18n.button.ok() },
  ]);
}
