import { debounce } from 'lodash';
import React from 'react';
import { Alert, Clipboard } from 'react-native';
import Mailer from 'react-native-mail';
import lang from 'i18n-js';
import { Button } from '../components/buttons';

const FeedbackEmailAddress = 'contact+alphafeedback@balance.io';

const handleSendFeedbackError = debounce(
  error =>
    (error
      ? Alert.alert(
        lang.t('wallet.feedback.error'),
        lang.t('wallet.feedback.choice'),
        [
          {
            text: lang.t('wallet.feedback.copy_email_address'),
            onPress: () => Clipboard.setString(FeedbackEmailAddress),
          },
          { text: lang.t('wallet.feedback.cancel'), style: 'cancel' },
        ],
      )
      : null),
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
  <Button onPress={handleSendFeedback}>{lang.t('wallet.feedback.send')}</Button>
);

export default SendFeedback;
