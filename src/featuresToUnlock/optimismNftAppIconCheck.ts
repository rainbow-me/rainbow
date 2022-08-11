import { Contract } from 'ethers';
// @ts-ignore-next-line
import { MMKV } from 'react-native-mmkv';
import { EthereumAddress } from '@/entities';
import { getProviderForNetwork } from '@/handlers/web3';
import { Network } from '@/helpers';
import config from '@/model/config';
import { Navigation } from '@/navigation';
import { opWrapABI } from '@/references';
import { logger } from '@/utils';
import Routes from '@rainbow-me/routes';

const OP_WRAPPER_ADDRESS = {
  'op-mainnet': '0x96a4f2d63b30c78e27025c2a4e4d3c049d02bdcb',
};

export const UNLOCK_KEY_OPTIMISM_NFT_APP_ICON = 'optimism_nft_app_icon';

type OpNetworks = 'op-mainnet';

const mmkv = new MMKV();

export const optimismNftAppIconCheck = async (
  featureCheckName: string,
  walletsToCheck: EthereumAddress[]
) => {
  const currentNetwork = config.op_nft_network as OpNetworks;
  logger.log('Checking OP NFT  on network', currentNetwork);
  const p = await getProviderForNetwork(Network.optimism);

  if (!p) return false;

  const opWrapperInstance = new Contract(
    OP_WRAPPER_ADDRESS[currentNetwork],
    opWrapABI,
    p
  );

  try {
    const found = await opWrapperInstance.areOwners(walletsToCheck);

    if (found) {
      Navigation.handleAction(Routes.EXPLAIN_SHEET, {
        onClose: () => {
          mmkv.set(featureCheckName, true);
          logger.log(
            'Feature check',
            featureCheckName,
            'set to true. Wont show up anymore!'
          );
        },
        type: 'optimism_app_icon',
      });
      return true;
    }
  } catch (e) {
    logger.log('areOwners blew up', e);
  }
  return false;
};
