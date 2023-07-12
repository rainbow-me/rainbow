import { arcClient, arcDevClient } from '@/graphql';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { IS_DEV } from '@/env';
import { Alert } from 'react-native';

export type PoapMintError = 'LIMIT_EXCEEDED' | 'EVENT_EXPIRED' | 'UNKNOWN';

export const getPoapAndOpenSheet = async (secretWord: string) => {
  const client = IS_DEV ? arcDevClient : arcClient;

  const event = await client.getPoapEventBySecretWord({
    secretWord: secretWord,
  });

  if (event.getPoapEventBySecretWord) {
    Navigation.handleAction(Routes.POAP_SHEET, {
      event: event.getPoapEventBySecretWord,
    });
  }
};
