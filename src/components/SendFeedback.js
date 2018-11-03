import { debounce } from 'lodash';
import React from 'react';
import { Clipboard } from 'react-native';
import Mailer from 'react-native-mail';
import lang from 'i18n-js';
import { Alert } from '../components/alerts';
import { Button } from '../components/buttons';

const FeedbackEmailAddress = 'contact+alphafeedback@balance.io';

const FeedbackErrorAlert = () => Alert({
  buttons: [{
    onPress: () => Clipboard.setString(FeedbackEmailAddress),
    text: lang.t('wallet.feedback.copy_email_address'),
  }, {
    text: lang.t('wallet.feedback.cancel'),
    style: 'cancel',
  }],
  message: lang.t('wallet.feedback.choice'),
  title: lang.t('wallet.feedback.error'),
});

const handleSendFeedbackError = debounce(
  error => (error ? FeedbackErrorAlert() : null),
  250,
);

const handleSendFeedback = () =>
  Mailer.mail(
    {
      recipients: [FeedbackEmailAddress],
      subject: lang.t('wallet.feedback.email_subject'),
    },
    handleSendFeedbackError,
  );

const SendFeedback = () => (
  <Button scaleTo={0.92} enableHapticFeedback={false} onPress={handleSendFeedback}>
    {lang.t('wallet.feedback.send')}
  </Button>
);

export default SendFeedback;
