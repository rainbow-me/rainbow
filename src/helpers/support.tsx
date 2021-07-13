import Clipboard from '@react-native-community/clipboard';
import { debounce } from 'lodash';
import Mailer from 'react-native-mail';
import { Alert } from '../components/alerts';

const SupportEmailAddress = 'support@rainbow.me';

const setClipboardToSupportEmail = () =>
  Clipboard.setString(SupportEmailAddress);

const SupportErrorAlert = () =>
  Alert({
    buttons: [
      {
        onPress: setClipboardToSupportEmail,
        text: 'Copy email address',
      },
      {
        style: 'cancel',
        text: 'No thanks',
      },
    ],
    message:
      'Would you like to manually copy our support email address to your clipboard?',
    title: 'Error launching email client',
  });

const handleMailError = debounce(
  error => (error ? SupportErrorAlert() : null),
  250
);

const messageSupport = () => Mailer.mail(supportEmailOptions, handleMailError);

const supportEmailOptions = {
  recipients: [SupportEmailAddress],
  subject: '🌈️ Rainbow Support',
};

export default function showWalletErrorAlert() {
  Alert({
    buttons: [
      {
        onPress: messageSupport,
        style: 'cancel',
        text: 'Message Support',
      },
      {
        text: 'Close',
      },
    ],
    message: `For help, please reach out to support! \nWe'll get back to you soon!`,
    title: 'An error ocurred',
  });
}
