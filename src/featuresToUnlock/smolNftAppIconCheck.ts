import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { Contract } from 'ethers';
// @ts-ignore-next-line
import { SMOL_KOVAN_RPC } from 'react-native-dotenv';
import { MMKV } from 'react-native-mmkv';
import { EthereumAddress } from '@/entities';
import { getProviderForNetwork } from '@/handlers/web3';
import { Network } from '@/helpers';
import config from '@/model/config';
import { Navigation } from '@/navigation';
import { opWrapABI } from '@/references';
import { logger } from '@/utils';
import Routes from '@rainbow-me/routes';

export const UNLOCK_KEY_SMOL_NFT_APP_ICON = 'smol_nft_app_icon';

const getKovanOpProvider = async () => {
  if (SMOL_KOVAN_RPC) {
    const provider = new StaticJsonRpcProvider(SMOL_KOVAN_RPC, 69);
    await provider.ready;
    return provider;
  }
  return null;
};

const mmkv = new MMKV();

export const smolNftAppIconCheck = async (
  featureCheckName: string,
  walletsToCheck: EthereumAddress[]
) => {
  const currentNetwork = config.arbitrum_mainnet_rpc;
  logger.log('Checking OP NFT  on network', currentNetwork);
  const p =
    // @ts-ignore-next-line
    currentNetwork === 'op-mainnet'
      ? await getProviderForNetwork(Network.optimism)
      : await getKovanOpProvider();

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
        type: 'smol_app_icon',
      });
      return true;
    }
  } catch (e) {
    logger.log('areOwners blew up', e);
  }
  return false;
};
