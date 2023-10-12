import { EthereumAddress } from '@/entities';
import { arcDevClient, arcClient } from '@/graphql';
import { getNetworkObj } from '@/networks';
import { Navigation } from '@/navigation';
import { Network } from '@/networks/types';
import Routes from '@/navigation/routesNames';
import { IS_DEV } from '@/env';
import { logger } from '@/logger';
import { WrappedAlert as Alert } from '@/helpers/alert';
import * as lang from '@/languages';

const client = IS_DEV ? arcDevClient : arcClient;
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
  network: Network
) => {
  logger.debug('Mints: Navigating to Mint Collection', {
    contractAddress,
    network,
  });
  try {
    const chainId = getNetworkObj(network).id;
    const res = await client.getReservoirCollection({
      contractAddress,
      chainId,
    });
    if (res?.getReservoirCollection?.collection) {
      Navigation.handleAction(Routes.MINT_SHEET, {
        collection: res.getReservoirCollection?.collection,
      });
    } else {
      logger.warn('Mints: No collection found', { contractAddress, network });
      showAlert();
    }
  } catch (e) {
    logger.warn('Mints: navigateToMintCollection error', {
      contractAddress,
      network,
      error: e,
    });
    showAlert();
  }
};
