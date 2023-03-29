import { debounce } from 'lodash';
// @ts-expect-error
import Mailer from 'react-native-mail';
import Clipboard from '@react-native-community/clipboard';

import { Alert } from '@/components/alerts';

type Options = {
  subject: string;
  email?: string;
};

export function emailRainbow({
  subject,
  email = 'support@rainbow.me',
}: Options) {
  const config = {
    recipients: [email],
    subject: `🌈️ Rainbow: ${subject}`,
  };

  Mailer.mail(
    config,
    debounce((error: unknown) => {
      if (error) {
        Alert({
          buttons: [
            {
              onPress: () => Clipboard.setString(email),
              text: 'Copy email address',
            },
            {
              style: 'cancel',
              text: 'No thanks',
            },
          ],
          message: `Would you like to manually copy our email address to your clipboard?`,
          title: 'Unable to auto-launch email client',
        });
      }
    }, 250)
  );
}
