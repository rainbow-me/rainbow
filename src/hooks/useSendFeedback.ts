import Clipboard from '@react-native-clipboard/clipboard';
import * as DeviceInfo from 'react-native-device-info';
import * as i18n from '@/languages';
import { Linking } from 'react-native';
import { Alert } from '../components/alerts';
import useAppVersion from './useAppVersion';
import { IS_IOS } from '@/env';
import { device } from '@/storage';
import { getWalletAddresses, getWallets } from '@/state/wallets/walletsStore';
import { capitalize } from 'lodash';

const FeedbackEmailAddress = 'support@rainbow.me';
const platform = IS_IOS ? 'iOS' : 'Android';
const categorySubjectMap: Record<SupportCategory, string> = {
  getting_started: 'Getting Started',
  backup_recovery: 'Backup & Recovery',
  tokens_transactions: 'Tokens & Transactions',
  bridge_swap: 'Bridge & Swap',
  points_rewards: 'Points & Rewards',
  security: 'Security',
  partnership: 'Partnership',
  other: 'Other',
};

export type SupportType = 'help' | 'feedback';

export type SupportCategory =
  | 'getting_started'
  | 'backup_recovery'
  | 'tokens_transactions'
  | 'bridge_swap'
  | 'points_rewards'
  | 'security'
  | 'partnership'
  | 'other';

export interface SendFeedbackOptions {
  type: SupportType;
  category?: SupportCategory;
}

const setClipboardToFeedbackEmail = () => Clipboard.setString(FeedbackEmailAddress);

const FeedbackErrorAlert = () =>
  Alert({
    buttons: [
      {
        onPress: setClipboardToFeedbackEmail,
        text: i18n.t(i18n.l.send_feedback.copy_email),
      },
      {
        style: 'cancel',
        text: i18n.t(i18n.l.send_feedback.no_thanks),
      },
    ],
    message: i18n.t(i18n.l.send_feedback.email_error.description),
    title: i18n.t(i18n.l.send_feedback.email_error.title),
  });

function buildDebugInfo(appVersion: string): string {
  const deviceModel = IS_IOS ? DeviceInfo.getModel() : `${capitalize(DeviceInfo.getBrand())} ${DeviceInfo.getModel()}`;
  const osVersion = DeviceInfo.getSystemVersion();
  const deviceId = device.get(['id']) ?? 'unknown';
  const walletAddresses = getWalletAddresses(getWallets());
  const formattedAddresses = walletAddresses.join(', ') || 'none';

  return [
    '---',
    'Debug Info (please do not delete):',
    `App: ${appVersion}`,
    `Platform: ${platform}`,
    `Device: ${deviceModel}`,
    `OS: ${platform} ${osVersion}`,
    `Device ID: ${deviceId}`,
    `Wallets: ${formattedAddresses}`,
  ].join('\n');
}

function buildMailtoUrl(appVersion: string, type: SupportType, category?: SupportCategory): string {
  let subject: string;

  if (type === 'help' && category) {
    const categoryLabel = categorySubjectMap[category];
    subject = `🌈 Help [${categoryLabel}] - ${platform} ${appVersion}`;
  } else {
    subject = `🌈 Feedback - ${platform} ${appVersion}`;
  }

  const debugInfo = buildDebugInfo(appVersion);
  const body = encodeURIComponent(`\n\n\n${debugInfo}`);
  return `mailto:${FeedbackEmailAddress}?subject=${encodeURIComponent(subject)}&body=${body}`;
}

export function useSendFeedback() {
  const appVersion = useAppVersion();

  return (options: SendFeedbackOptions) => {
    Linking.openURL(buildMailtoUrl(appVersion, options.type, options.category)).catch(FeedbackErrorAlert);
  };
}
