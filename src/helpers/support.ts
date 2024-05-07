import Clipboard from '@react-native-clipboard/clipboard';
import { debounce } from 'lodash';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import Mailer from 'react-native-mail';
import { Alert } from '../components/alerts';
import * as i18n from '@/languages';
import { Linking } from 'react-native';

const SupportEmailAddress = 'support@rainbow.me';

// this whole file

const setClipboardToSupportEmail = () => Clipboard.setString(SupportEmailAddress);

const SupportErrorAlert = () =>
  Alert({
    buttons: [
      {
        onPress: setClipboardToSupportEmail,
        text: i18n.t(i18n.l.support.error_alert.copy_email_address),
      },
      {
        style: 'cancel',
        text: i18n.t(i18n.l.support.error_alert.no_thanks),
      },
    ],
    message: i18n.t(i18n.l.support.error_alert.message),
    title: i18n.t(i18n.l.support.error_alert.title),
  });

const handleMailError = debounce(error => (error ? SupportErrorAlert() : null), 250);

const openLearnMorePage = () => Linking.openURL('https://support.rainbow.me/en/articles/7975958-an-error-occurred');

const messageSupport = () => Mailer.mail(supportEmailOptions, handleMailError);

const supportEmailOptions = {
  recipients: [SupportEmailAddress],
  subject: '🌈️ Rainbow Support: An Error Occurred',
};

export default function showWalletErrorAlert() {
  Alert({
    cancelable: true,
    buttons: [
      {
        onPress: openLearnMorePage,
        text: i18n.t(i18n.l.support.wallet_alert.learn_more),
      },
      {
        onPress: messageSupport,
        isPreferred: true,
        text: i18n.t(i18n.l.support.wallet_alert.message_support),
      },
      {
        text: i18n.t(i18n.l.support.wallet_alert.close),
        style: 'destructive',
      },
    ],
    message: i18n.t(i18n.l.support.wallet_alert.message),
    title: i18n.t(i18n.l.support.wallet_alert.title),
  });
}
