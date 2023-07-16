import { arcClient, arcDevClient } from '@/graphql';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { IS_DEV } from '@/env';
import { logger } from '@/logger';

export type PoapMintError = 'LIMIT_EXCEEDED' | 'EVENT_EXPIRED' | 'UNKNOWN';

export const getPoapAndOpenSheetWithSecretWord = async (
  secretWord: string,
  goBack: boolean
) => {
  try {
    const client = IS_DEV ? arcDevClient : arcClient;

    const event = await client.getPoapEventBySecretWord({
      secretWord,
    });

    if (event.getPoapEventBySecretWord) {
      if (goBack) {
        Navigation.goBack();
      }
      Navigation.handleAction(Routes.POAP_SHEET, {
        event: event.getPoapEventBySecretWord,
      });
    }
  } catch (e) {
    logger.warn('Error getting POAP with secret word');
  }
};

export const getPoapAndOpenSheetWithQRHash = async (
  qrHash: string,
  goBack: boolean
) => {
  try {
    const client = IS_DEV ? arcDevClient : arcClient;

    const event = await client.getPoapEventByQrHash({
      qrHash,
    });

    if (event.getPoapEventByQrHash) {
      if (goBack) {
        Navigation.goBack();
      }
      Navigation.handleAction(Routes.POAP_SHEET, {
        event: event.getPoapEventByQrHash,
      });
    }
  } catch {
    logger.warn('Error getting POAP with qrHash');
  }
};
