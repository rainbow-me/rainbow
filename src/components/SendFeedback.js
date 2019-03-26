import lang from 'i18n-js';
import { debounce } from 'lodash';
import React from 'react';
import { Clipboard } from 'react-native';
import Mailer from 'react-native-mail';
import { Alert } from './alerts';
import { Button } from './buttons';

const FeedbackEmailAddress = 'support@rainbow.me';

const FeedbackErrorAlert = () => Alert({
  buttons: [{
    onPress: () => Clipboard.setString(FeedbackEmailAddress),
    text: lang.t('wallet.feedback.copy_email_address'),
  }, {
    style: 'cancel',
    text: lang.t('wallet.feedback.cancel'),
  }],
  message: lang.t('wallet.feedback.choice'),
  title: lang.t('wallet.feedback.error'),
});

const handleSendFeedbackError = debounce(
  error => (error ? FeedbackErrorAlert() : null),
  250,
);

const handleSendFeedback = () => {
  const feedbackEmailOptions = {
    recipients: [FeedbackEmailAddress],
    subject: lang.t('wallet.feedback.email_subject'),
  };

  return Mailer.mail(feedbackEmailOptions, handleSendFeedbackError);
};

const SendFeedback = () => (
  <Button scaleTo={0.92} enableHapticFeedback={false} onPress={handleSendFeedback}>
    {lang.t('wallet.feedback.send')}
  </Button>
);

export default SendFeedback;
