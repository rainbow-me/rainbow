import Clipboard from '@react-native-community/clipboard';
import { debounce } from 'lodash';
import { useCallback } from 'react';
import Mailer from 'react-native-mail';
import { Alert } from '../components/alerts';
import useAppVersion from './useAppVersion';

const FeedbackEmailAddress = 'support@rainbow.me';

const setClipboardToFeedbackEmail = () =>
  Clipboard.setString(FeedbackEmailAddress);

const FeedbackErrorAlert = () =>
  Alert({
    buttons: [
      {
        onPress: setClipboardToFeedbackEmail,
        text: 'Copy email address',
      },
      {
        style: 'cancel',
        text: 'No thanks',
      },
    ],
    message:
      'Would you like to manually copy our feedback email address to your clipboard?',
    title: 'Error launching email client',
  });

const handleMailError = debounce(
  error => (error ? FeedbackErrorAlert() : null),
  250
);

function feedbackEmailOptions(appVersion) {
  return {
    recipients: [FeedbackEmailAddress],
    subject: `🌈️ Rainbow Feedback - ${ios ? 'iOS' : 'Android'} ${appVersion}`,
  };
}

export default function useSendFeedback() {
  const appVersion = useAppVersion();
  const onSendFeedback = useCallback(
    () => Mailer.mail(feedbackEmailOptions(appVersion), handleMailError),
    [appVersion]
  );
  return onSendFeedback;
}
