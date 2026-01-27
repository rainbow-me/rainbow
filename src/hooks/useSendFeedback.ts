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

function buildMailtoUrl(appVersion: string): string {
  const subject = encodeURIComponent(`🌈️ Rainbow Feedback - ${platform} ${appVersion}`);
  const debugInfo = buildDebugInfo(appVersion);
  const body = encodeURIComponent(`\n\n\n${debugInfo}`);
  return `mailto:${FeedbackEmailAddress}?subject=${subject}&body=${body}`;
}

export default function useSendFeedback() {
  const appVersion = useAppVersion();

  return () => {
    Linking.openURL(buildMailtoUrl(appVersion)).catch(FeedbackErrorAlert);
  };
}
