import { MMKV } from 'react-native-mmkv';
import { checkIfWalletsOwnNft } from './tokenGatedUtils';
import { EthereumAddress } from '@/entities';
import { Network } from '@/helpers';
import { Navigation } from '@/navigation';
import { logger } from '@/utils';
import Routes from '@rainbow-me/routes';

export const UNLOCK_KEY_OPTIMISM_NFT_APP_ICON = 'optimism_nft_app_icon';

const TOKEN_ADDRESSES: EthereumAddress[] = [
  '0x81b30ff521D1fEB67EDE32db726D95714eb00637',
];
const NETWORK = Network.optimism;

// This is a temp fix while we still use kovan optimism for testing.
// Will be removed before release

const mmkv = new MMKV();

export const optimismNftAppIconCheck = async (
  featureCheckName: string,
  walletsToCheck: EthereumAddress[]
) => {
  logger.log('Checking OP NFT  on network', NETWORK);
  try {
    const found = await checkIfWalletsOwnNft(
      TOKEN_ADDRESSES,
      NETWORK,
      walletsToCheck
    );

    // We open the sheet with a setTimeout 1 sec later to make sure we can return first
    // so we can abort early if we're showing a sheet to prevent 2+ sheets showing at the same time

    setTimeout(() => {
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
    }, 1000);
    return found;
  } catch (e) {
    logger.log('areOwners blew up', e);
  }
  return false;
};
