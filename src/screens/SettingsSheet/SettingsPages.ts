import * as lang from '@/languages';

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
    getTitle: () => lang.t(lang.l.settings.app_icon),
    key: Routes.SETTINGS_SECTION_APP_ICON,
  },
  backup: {
    component: WalletsAndBackup,
    getTitle: () => lang.t('settings.backup'),
    key: Routes.SETTINGS_SECTION_BACKUP,
  },
  currency: {
    component: CurrencySection,
    getTitle: () => lang.t(lang.l.settings.currency.title),
    key: Routes.SETTINGS_SECTION_CURRENCY,
  },
  default: {
    component: null,
    getTitle: () => lang.t(lang.l.settings.label),
    key: Routes.SETTINGS_SECTION,
  },
  dev: {
    component: DevSection,
    getTitle: () => lang.t(lang.l.settings.developer),
    key: Routes.SETTINGS_SECTION_DEV,
  },
  language: {
    component: LanguageSection,
    getTitle: () => lang.t(lang.l.settings.language),
    key: Routes.SETTINGS_SECTION_LANGUAGE,
  },
  network: {
    component: NetworkSection,
    getTitle: () => lang.t(lang.l.settings.network),
    key: Routes.SETTINGS_SECTION_NETWORK,
  },
  notifications: {
    component: NotificationsSection,
    getTitle: () => lang.t(lang.l.settings.notifications),
    key: Routes.SETTINGS_SECTION_NOTIFICATIONS,
  },
  privacy: {
    component: PrivacySection,
    getTitle: () => lang.t(lang.l.settings.privacy),
    key: Routes.SETTINGS_SECTION_PRIVACY,
  },
};
