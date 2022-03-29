import Clipboard from '@react-native-community/clipboard';
import lang from 'i18n-js';
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
        text: lang.t('send_feedback.copy_email'),
      },
      {
        style: 'cancel',
        text: lang.t('send_feedback.no_thanks'),
      },
    ],
    message: lang.t('send_feedback.email_error.description'),
    title: lang.t('send_feedback.email_error.title'),
  });

const handleMailError = debounce(
  error => (error ? FeedbackErrorAlert() : null),
  250
);

function feedbackEmailOptions(appVersion, codePushVersion) {
  return {
    recipients: [FeedbackEmailAddress],
    subject: `🌈️ Rainbow Feedback - ${
      ios ? 'iOS' : 'Android'
    } ${appVersion} (CP: ${codePushVersion})`,
  };
}

export default function useSendFeedback() {
  const [appVersion, codePushVersion] = useAppVersion();
  const onSendFeedback = useCallback(
    () =>
      Mailer.mail(
        feedbackEmailOptions(appVersion, codePushVersion),
        handleMailError
      ),
    [appVersion, codePushVersion]
  );
  return onSendFeedback;
}
