import * as i18n from '@/languages';

import Routes from '@/navigation/routesNames';

import AppIconSection from './components/AppIconSection';
import WalletsAndBackup from './components/Backups/WalletsAndBackup';
import CurrencySection from './components/CurrencySection';
import LanguageSection from './components/LanguageSection';
import DevSection from './components/DevSection';
import NetworkSection from './components/NetworkSection';
import PrivacySection from './components/PrivacySection';
import NotificationsSection from './components/NotificationsSection';

export const SettingsPages = {
  appIcon: {
    component: AppIconSection,
    getTitle: () => i18n.t(i18n.l.settings.app_icon),
    key: Routes.SETTINGS_SECTION_APP_ICON,
  },
  backup: {
    component: WalletsAndBackup,
    getTitle: () => i18n.t(i18n.l.settings.backup),
    key: Routes.SETTINGS_SECTION_BACKUP,
  },
  currency: {
    component: CurrencySection,
    getTitle: () => i18n.t(i18n.l.settings.currency.title),
    key: Routes.SETTINGS_SECTION_CURRENCY,
  },
  default: {
    component: null,
    getTitle: () => i18n.t(i18n.l.settings.label),
    key: Routes.SETTINGS_SECTION,
  },
  dev: {
    component: DevSection,
    getTitle: () => i18n.t(i18n.l.settings.developer),
    key: Routes.SETTINGS_SECTION_DEV,
  },
  language: {
    component: LanguageSection,
    getTitle: () => i18n.t(i18n.l.settings.language),
    key: Routes.SETTINGS_SECTION_LANGUAGE,
  },
  network: {
    component: NetworkSection,
    getTitle: () => i18n.t(i18n.l.settings.network),
    key: Routes.SETTINGS_SECTION_NETWORK,
  },
  notifications: {
    component: NotificationsSection,
    getTitle: () => i18n.t(i18n.l.settings.notifications),
    key: Routes.SETTINGS_SECTION_NOTIFICATIONS,
  },
  privacy: {
    component: PrivacySection,
    getTitle: () => i18n.t(i18n.l.settings.privacy),
    key: Routes.SETTINGS_SECTION_PRIVACY,
  },
};
