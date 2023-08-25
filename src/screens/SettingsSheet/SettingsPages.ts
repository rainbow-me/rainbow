import lang from 'i18n-js';

import Routes from '@/navigation/routesNames';

import AppIconSection from './components/AppIconSection';
import BackupSection from './components/BackupSection';
import CurrencySection from './components/CurrencySection';
import LanguageSection from './components/LanguageSection';
import DevSection from './components/DevSection';
import NetworkSection from './components/NetworkSection';
import PrivacySection from './components/PrivacySection';
import NotificationsSection from './components/NotificationsSection';

export const SettingsPages = {
  appIcon: {
    component: AppIconSection,
    getTitle: () => lang.t('settings.app_icon'),
    key: Routes.SETTINGS_SECTION_APP_ICON,
  },
  backup: {
    component: BackupSection,
    getTitle: () => lang.t('settings.backup'),
    key: Routes.SETTINGS_SECTION_BACKUP,
  },
  currency: {
    component: CurrencySection,
    getTitle: () => lang.t('settings.currency'),
    key: Routes.SETTINGS_SECTION_CURRENCY,
  },
  default: {
    component: null,
    getTitle: () => lang.t('settings.label'),
    key: Routes.SETTINGS_SECTION,
  },
  dev: {
    component: DevSection,
    getTitle: () => lang.t('settings.dev'),
    key: Routes.SETTINGS_SECTION_DEV,
  },
  language: {
    component: LanguageSection,
    getTitle: () => lang.t('settings.language'),
    key: Routes.SETTINGS_SECTION_LANGUAGE,
  },
  network: {
    component: NetworkSection,
    getTitle: () => lang.t('settings.network'),
    key: Routes.SETTINGS_SECTION_NETWORK,
  },
  notifications: {
    component: NotificationsSection,
    getTitle: () => lang.t('settings.notifications'),
    key: Routes.SETTINGS_SECTION_NOTIFICATIONS,
  },
  privacy: {
    component: PrivacySection,
    getTitle: () => lang.t('settings.privacy'),
    key: Routes.SETTINGS_SECTION_PRIVACY,
  },
};
