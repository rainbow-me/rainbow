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
    'Could not find collection',
    'We are unable to find this collection, double check the address and network or try again later',
    [{ text: lang.t(lang.l.button.ok) }],
    { cancelable: false }
  );
};
export const navigateToMintCollection = async (
  contractAddress: EthereumAddress,
  network: Network
) => {
  try {
    const chainId = getNetworkObj(network).id;
    const res = await client.getReservoirCollection({
      contractAddress,
      chainId,
    });
    if (res?.getReserviorCollection?.collection) {
      Navigation.handleAction(Routes.MINT_SHEET, {
        collection: res.getReserviorCollection?.collection,
      });
    } else {
      showAlert();
    }
  } catch (e) {
    showAlert();
  }
};
