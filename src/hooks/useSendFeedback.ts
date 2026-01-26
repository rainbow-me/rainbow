import Clipboard from '@react-native-clipboard/clipboard';
import * as i18n from '@/languages';
import { Linking } from 'react-native';
import { Alert } from '../components/alerts';
import useAppVersion from './useAppVersion';
import { ios } from '@/env';

const FeedbackEmailAddress = 'support@rainbow.me';

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

function buildMailtoUrl(appVersion: string): string {
  const subject = encodeURIComponent(`🌈️ Rainbow Feedback - ${ios ? 'iOS' : 'Android'} ${appVersion}`);
  return `mailto:${FeedbackEmailAddress}?subject=${subject}`;
}

export default function useSendFeedback() {
  const appVersion = useAppVersion();

  return () => {
    Linking.openURL(buildMailtoUrl(appVersion)).catch(FeedbackErrorAlert);
  };
}
