import Clipboard from '@react-native-community/clipboard';
import lang from 'i18n-js';
import { debounce } from 'lodash';
import { useCallback } from 'react';
import Mailer from 'react-native-mail';
import { Alert } from '../components/alerts';

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
        text: lang.t('button.no_thanks'),
      },
    ],
    message: lang.t('send_feedback.email_error.description'),
    title: lang.t('send_feedback.email_error.label'),
  });

const handleMailError = debounce(
  error => (error ? FeedbackErrorAlert() : null),
  250
);

const feedbackEmailOptions = {
  recipients: [FeedbackEmailAddress],
  subject: '🌈️ Rainbow Feedback',
};

export default function useSendFeedback() {
  const onSendFeedback = useCallback(
    () => Mailer.mail(feedbackEmailOptions, handleMailError),
    []
  );
  return onSendFeedback;
}
