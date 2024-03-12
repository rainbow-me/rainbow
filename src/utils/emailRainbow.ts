import { debounce } from 'lodash';
// @ts-expect-error
import Mailer from 'react-native-mail';
import Clipboard from '@react-native-clipboard/clipboard';

import { Alert } from '@/components/alerts';
import * as lang from '@/languages';

type Options = {
  subject: string;
  email?: string;
  hideRainbowBranding?: boolean;
};

export function emailRainbow({ subject, email = 'support@rainbow.me', hideRainbowBranding = false }: Options) {
  const config = {
    recipients: [email],
    subject: hideRainbowBranding ? subject : `🌈️ Rainbow: ${subject}`,
  };

  Mailer.mail(
    config,
    debounce((error: unknown) => {
      if (error) {
        Alert({
          buttons: [
            {
              onPress: () => Clipboard.setString(email),
              text: lang.t(lang.l.support.error_alert.copy_email_address),
            },
            {
              style: 'cancel',
              text: lang.t(lang.l.support.error_alert.no_thanks),
            },
          ],
          message: lang.t(lang.l.support.error_alert.message),
          title: lang.t(lang.l.support.error_alert.title),
        });
      }
    }, 250)
  );
}
