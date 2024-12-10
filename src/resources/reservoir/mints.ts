import { EthereumAddress } from '@/entities';
import { arcClient } from '@/graphql';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { logger } from '@/logger';
import { WrappedAlert as Alert } from '@/helpers/alert';
import * as lang from '@/languages';
import { BigNumberish } from '@ethersproject/bignumber';
import { ChainId } from '@/state/backendNetworks/types';

const showAlert = () => {
  Alert.alert(
    lang.t(lang.l.minting.could_not_find_collection),
    lang.t(lang.l.minting.unable_to_find_check_again),
    [{ text: lang.t(lang.l.button.ok) }],
    { cancelable: false }
  );
};

export const navigateToMintCollection = async (
  contractAddress: EthereumAddress,
  pricePerMint: BigNumberish | undefined,
  chainId: ChainId
) => {
  logger.debug('[mints]: Navigating to Mint Collection', {
    contractAddress,
    chainId,
  });

  try {
    const res = await arcClient.getReservoirCollection({
      contractAddress,
      chainId,
    });
    if (res?.getReservoirCollection?.collection) {
      Navigation.handleAction(Routes.MINT_SHEET, {
        collection: res.getReservoirCollection?.collection,
        pricePerMint,
      });
    } else {
      logger.warn('[mints]: No collection found', { contractAddress, chainId });
      showAlert();
    }
  } catch (e) {
    logger.warn(`[mints]: navigateToMintCollection error`, {
      contractAddress,
      chainId,
      error: e,
    });
    showAlert();
  }
};
