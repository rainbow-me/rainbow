import { arcClient } from '@/graphql';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { logger } from '@/logger';

export type PoapMintError = 'LIMIT_EXCEEDED' | 'EVENT_EXPIRED' | 'UNKNOWN';

export const getPoapAndOpenSheetWithSecretWord = async (secretWord: string, goBack = false) => {
  try {
    const event = await arcClient.getPoapEventBySecretWord({
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
    logger.warn('[poaps]: Error getting POAP with secret word');
  }
};

export const getPoapAndOpenSheetWithQRHash = async (qrHash: string, goBack = false) => {
  try {
    const event = await arcClient.getPoapEventByQrHash({
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
    logger.warn('[poaps]: Error getting POAP with qrHash');
  }
};
