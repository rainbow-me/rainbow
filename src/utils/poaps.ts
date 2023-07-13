import { arcClient, arcDevClient } from '@/graphql';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { IS_DEV } from '@/env';

export type PoapMintError = 'LIMIT_EXCEEDED' | 'EVENT_EXPIRED' | 'UNKNOWN';

export const getPoapAndOpenSheetWithSecretWord = async (secretWord: string) => {
  const client = IS_DEV ? arcDevClient : arcClient;

  const event = await client.getPoapEventBySecretWord({
    secretWord,
  });

  if (event.getPoapEventBySecretWord) {
    Navigation.handleAction(Routes.POAP_SHEET, {
      event: event.getPoapEventBySecretWord,
    });
  }
};

export const getPoapAndOpenSheetWithQRHash = async (qrHash: string) => {
  const client = IS_DEV ? arcDevClient : arcClient;

  const event = await client.getPoapEventByQrHash({
    qrHash,
  });

  if (event.getPoapEventByQrHash) {
    Navigation.handleAction(Routes.POAP_SHEET, {
      event: event.getPoapEventByQrHash,
    });
  }
};
