import { Alert } from 'react-native';
import * as i18n from '@/languages';

export function showNotificationSubscriptionErrorAlert() {
  Alert.alert(
    i18n.t(i18n.l.settings.notifications_section.error_alert_title),
    i18n.t(i18n.l.settings.notifications_section.error_alert_content),
    [{ text: i18n.t(i18n.l.button.ok) }]
  );
}
export function showOfflineAlert() {
  Alert.alert(
    i18n.t(i18n.l.settings.notifications_section.error_alert_title),
    i18n.t(i18n.l.settings.notifications_section.offline_alert_content),
    [{ text: i18n.t(i18n.l.button.ok) }]
  );
}
