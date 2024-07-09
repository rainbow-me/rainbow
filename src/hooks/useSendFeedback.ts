import Clipboard from '@react-native-clipboard/clipboard';
import lang from 'i18n-js';
import { debounce } from 'lodash';
import { useCallback } from 'react';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import Mailer from 'react-native-mail';
import { Alert } from '../components/alerts';
import useAppVersion from './useAppVersion';

const FeedbackEmailAddress = 'support@rainbow.me';

const setClipboardToFeedbackEmail = () => Clipboard.setString(FeedbackEmailAddress);

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

const handleMailError = debounce(error => (error ? FeedbackErrorAlert() : null), 250);

function feedbackEmailOptions(appVersion: string) {
  return {
    recipients: [FeedbackEmailAddress],
    subject: `🌈️ Rainbow Feedback - ${ios ? 'iOS' : 'Android'} ${appVersion}`,
  };
}

export default function useSendFeedback() {
  const appVersion = useAppVersion();
  const onSendFeedback = useCallback(() => Mailer.mail(feedbackEmailOptions(appVersion), handleMailError), [appVersion]);
  return onSendFeedback;
}
