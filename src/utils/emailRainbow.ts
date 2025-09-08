import { debounce } from 'lodash';
// @ts-expect-error
import Mailer from 'react-native-mail';
import Clipboard from '@react-native-clipboard/clipboard';

import { Alert } from '@/components/alerts';
import * as i18n from '@/languages';

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
      }
    }, 250)
  );
}
