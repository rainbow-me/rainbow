import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { Contract } from 'ethers';
import { InteractionManager } from 'react-native';
// @ts-ignore-next-line
import { OPTIMISM_KOVAN_RPC } from 'react-native-dotenv';
import { MMKV } from 'react-native-mmkv';
import { EthereumAddress } from '@/entities';
import { getProviderForNetwork } from '@/handlers/web3';
import { Network } from '@/helpers';
import { Navigation } from '@/navigation';
import { opWrapABI } from '@/references';
import { logger } from '@/utils';
import Routes from '@rainbow-me/routes';

const OP_WRAPPER_ADDRESS = {
  'op-kovan': '0x715da5e53526bedac9bd96e8fdb7efb185d1b6ca',
  'op-mainnet': '0x58AcA48312f44C2f8215E5FBa67078Fb0cfd45bA',
};

const CURRENT_NETWORK = 'op-kovan';

export const UNLOCK_KEY_OPTIMISM_NFT_APP_ICON = 'optimism_nft_app_icon';

// This is a temp fix while we still use kovan optimism for testing.
// Will be removed before release

const getKovanOpProvider = async () => {
  const provider = new StaticJsonRpcProvider(OPTIMISM_KOVAN_RPC, 69);
  await provider.ready;
  return provider;
};

export const optimismNftAppIconCheck = async (
  featureCheckName: string,
  walletsToCheck: EthereumAddress[]
) => {
  const p =
    // @ts-ignore-next-line
    CURRENT_NETWORK === 'op-mainnet'
      ? await getProviderForNetwork(Network.optimism)
      : await getKovanOpProvider();

  const opWrapperInstance = new Contract(
    OP_WRAPPER_ADDRESS[CURRENT_NETWORK],
    opWrapABI,
    p
  );

  try {
    const found = await opWrapperInstance.areOwners(walletsToCheck);

    if (found) {
      logger.debug('navigating to OP NFT sheet...');
      Navigation.handleAction(Routes.EXPLAIN_SHEET, {
        onClose: () => {
          InteractionManager.runAfterInteractions(() => {
            setTimeout(() => {
              const mmkv = new MMKV();
              mmkv.set(featureCheckName, true);
              logger.debug(
                'Feature check',
                featureCheckName,
                'set to true. Wont show up anymore!'
              );
            }, 250);
          });
        },
        type: 'floor_price',
      });
      return true;
    }
  } catch (e) {
    logger.debug('areOwners blew up', e);
  }
  return false;
};
