import { captureException } from '@sentry/react-native';
import { Wallet } from 'ethers';
import { isEmpty, map } from 'lodash';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import WalletTypes from '../helpers/walletTypes';
import { loadAllKeys } from '../model/keychain';
import {
  DEFAULT_WALLET_NAME,
  getWallet,
  identifyWalletType,
  loadAddress,
  savePrivateKey,
} from '../model/wallet';
import {
  walletsLoadState,
  walletsSetSelected,
  walletsUpdate,
} from '../redux/wallets';
import {
  allWalletsKey,
  privateKeyKey,
  seedPhraseKey,
  selectedWalletKey,
} from '../utils/keychainConstants';
import useInitializeWallet from './useInitializeWallet';
import useWallets from './useWallets';
import { colors } from '@rainbow-me/styles';
import logger from 'logger';

const keysOnly = keysWithValues => map(keysWithValues, item => item?.username);

export default function useWalletsDebug() {
  const { selectedWallet, wallets } = useWallets();
  const initializeWallet = useInitializeWallet();
  const dispatch = useDispatch();

  const debug = useCallback(async () => {
    const isIncomplete = isEmpty(selectedWallet) || !wallets;
    let allKeys = await loadAllKeys();
    let status = '';
    if (!isIncomplete) {
      status = 'complete';
    } else {
      try {
        // Read from the old wallet data
        const address = await loadAddress();

        if (address) {
          const seed = allKeys.find(
            item => item.username.indexOf('_rainbowSeedPhrase') !== -1
          );
          if (!seed) {
            throw Error('Missing seed');
          }
          const itemKey = seed.username.split(`_${seedPhraseKey}`);
          const id = itemKey[0];
          const seedObject = JSON.parse(seed.password);
          const type = identifyWalletType(seedObject.seedphrase);

          const currentWallet = {
            addresses: [
              {
                address,
                avatar: null,
                color: colors.getRandomColor(),
                index: 0,
                label: '',
                visible: true,
              },
            ],
            color: 0,
            id,
            imported: false,
            name: DEFAULT_WALLET_NAME,
            primary: true,
            type,
          };

          const wallets = { [id]: currentWallet };

          await dispatch(walletsUpdate(wallets));
          await dispatch(walletsSetSelected(currentWallet));
          await dispatch(walletsLoadState());

          let wallet;
          if (type === WalletTypes.privateKey) {
            wallet = new Wallet(seedObject.seedphrase);
          } else {
            const walletData = getWallet(seedObject.seedphrase);
            wallet = walletData.wallet;
          }

          await savePrivateKey(wallet.address, wallet.privateKey);

          allKeys = allKeys.concat([
            { username: selectedWalletKey },
            { username: allWalletsKey },
            { username: `${address}_${privateKeyKey}` },
          ]);

          await initializeWallet();
          status = 'restored';
        }
      } catch (e) {
        logger.sentry(
          'Error while trying to restore wallet on useWalletsDebug'
        );
        captureException(e);
        status = 'failed';
      }
    }

    return {
      data: JSON.stringify(keysOnly(allKeys), null, 2),
      status,
    };
  }, [dispatch, initializeWallet, selectedWallet, wallets]);

  return debug;
}
