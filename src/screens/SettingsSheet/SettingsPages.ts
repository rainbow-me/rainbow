import lang from 'i18n-js';
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
    key: 'AppIconSection',
  },
  backup: {
    component: BackupSection,
    getTitle: () => lang.t('settings.backup'),
    key: 'BackupSection',
  },
  currency: {
    component: CurrencySection,
    getTitle: () => lang.t('settings.currency'),
    key: 'CurrencySection',
  },
  default: {
    component: null,
    getTitle: () => lang.t('settings.label'),
    key: 'SettingsSection',
  },
  dev: {
    component: DevSection,
    getTitle: () => lang.t('settings.dev'),
    key: 'DevSection',
  },
  language: {
    component: LanguageSection,
    getTitle: () => lang.t('settings.language'),
    key: 'LanguageSection',
  },
  network: {
    component: NetworkSection,
    getTitle: () => lang.t('settings.networks'),
    key: 'NetworkSection',
  },
  notifications: {
    component: NotificationsSection,
    getTitle: () => lang.t('settings.notifications'),
    key: 'NotificationsSection',
  },
  privacy: {
    component: PrivacySection,
    getTitle: () => lang.t('settings.privacy'),
    key: 'PrivacySection',
  },
};
