import { debounce, upperFirst } from 'lodash';
import { useCallback, useMemo } from 'react';
import Mailer from 'react-native-mail';
import { Alert } from '../components/alerts';
import useClipboard from './useClipboard';

export default function useEmailRainbow({
  emailAddress = 'support@rainbow.me',
  subject = 'feedback',
}) {
  const { setClipboard } = useClipboard();

  const emailOptions = useMemo(
    () => ({
      recipients: [emailAddress],
      subject: `🌈️ Rainbow ${upperFirst(subject)}`,
    }),
    [emailAddress, subject]
  );

  const handleFallbackAlert = useCallback(
    error =>
      error
        ? Alert({
            buttons: [
              {
                onPress: () => setClipboard(emailAddress),
                text: 'Copy email address',
              },
              {
                style: 'cancel',
                text: 'No thanks',
              },
            ],
            message: `Would you like to manually copy our email address to your clipboard?`,
            title: 'Unable to auto-launch email client',
          })
        : null,
    [emailAddress, setClipboard]
  );

  return useCallback(
    () => Mailer.mail(emailOptions, debounce(handleFallbackAlert, 250)),
    [emailOptions, handleFallbackAlert]
  );
}
