import { arcClient, arcDevClient } from '@/graphql';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { IS_DEV } from '@/env';

export type PoapMintError = 'LIMIT_EXCEEDED' | 'EVENT_EXPIRED' | 'UNKNOWN';

const POAP_REGEX = /(?:[A-Za-z]+-){2}[A-Za-z]+$/;

export const checkValidSecretWord = (secretWord: string) => {
  return POAP_REGEX.test(secretWord);
};

export const getPoapAndOpenSheet = async (secretWord: string) => {
  const client = IS_DEV ? arcDevClient : arcClient;
  const event = await client.getPoapEventBySecretWord({
    secretWord: secretWord,
  });

  Navigation.handleAction(Routes.POAP_SHEET, {
    event: event.getPoapEventBySecretWord,
  });
};
