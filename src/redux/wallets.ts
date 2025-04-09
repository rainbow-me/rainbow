import { captureMessage } from '@sentry/react-native';
import { toChecksumAddress } from 'ethereumjs-util';
import { isEmpty, keys } from 'lodash';
import { Dispatch } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import { saveKeychainIntegrityState } from '../handlers/localstorage/globalSettings';
import { getWalletNames, saveWalletNames } from '../handlers/localstorage/walletNames';
import WalletTypes from '../helpers/walletTypes';
import { fetchENSAvatar } from '../hooks/useENSAvatar';
import { hasKey } from '../model/keychain';
import { PreferenceActionType, setPreference } from '../model/preferences';
import {
  generateAccount,
  getAllWallets,
  getSelectedWallet,
  loadAddress,
  RainbowAccount,
  RainbowWallet,
  saveAddress,
  saveAllWallets,
  setSelectedWallet,
} from '../model/wallet';
import { addressKey, oldSeedPhraseMigratedKey, privateKeyKey, seedPhraseKey } from '../utils/keychainConstants';
import { addressHashedColorIndex, addressHashedEmoji, fetchReverseRecordWithRetry } from '../utils/profileUtils';
import { settingsUpdateAccountAddress } from './settings';
import { updateWebDataEnabled } from './showcaseTokens';
import { AppGetState, AppState } from './store';
import { fetchReverseRecord } from '@/handlers/ens';
import { lightModeThemeColors } from '@/styles';
import { RainbowError, logger } from '@/logger';
import { parseTimestampFromBackupFile } from '@/model/backup';
import { createRainbowStore } from '../state/internal/createRainbowStore';

interface WalletsState {
  selected: RainbowWallet | undefined;
  setSelectedWallet: (wallet: RainbowWallet) => Promise<void>;

  walletNames: { [address: string]: string };
  updateWalletNames: (names: { [address: string]: string }) => void;

  wallets: { [id: string]: RainbowWallet } | null;
  updateWallets: (wallets: { [id: string]: RainbowWallet }) => Promise<void>;

  loadWallets: (data: Pick<WalletsState, 'selected' | 'walletNames' | 'wallets'>) => void;

  createAccount: (data: Pick<RainbowWallet, 'id' | 'name' | 'color'>) => void;

  setAllWalletsWithIdsAsBackedUp: (
    ids: RainbowWallet['id'][],
    method: RainbowWallet['backupType'],
    backupFile?: RainbowWallet['backupFile']
  ) => void;

  setWalletBackedUp: (id: RainbowWallet['id'], method: RainbowWallet['backupType'], backupFile?: RainbowWallet['backupFile']) => void;

  clearAllWalletsBackupStatus: () => void;

  addressSetSelected: (address: string) => void;
}

const walletsStore = createRainbowStore<WalletsState>((set, get) => ({
  selected: undefined,
  async setSelectedWallet(wallet) {
    await setSelectedWallet(wallet);
    set({
      selected: wallet,
    });
  },

  walletNames: {},
  updateWalletNames(walletNames) {
    set({
      walletNames,
    });
  },

  wallets: null,
  async updateWallets(wallets) {
    await saveAllWallets(wallets);
    set({
      wallets,
    });
  },

  loadWallets() {
    // try {
    //   const { accountAddress } = getState().settings;
    //   let addressFromKeychain: string | null = accountAddress;
    //   const allWalletsResult = await getAllWallets();
    //   const wallets = allWalletsResult?.wallets || {};
    //   if (isEmpty(wallets)) return;
    //   const selected = await getSelectedWallet();
    //   // Prevent irrecoverable state (no selected wallet)
    //   let selectedWallet = selected?.wallet;
    //   // Check if the selected wallet is among all the wallets
    //   if (selectedWallet && !wallets[selectedWallet.id]) {
    //     // If not then we should clear it and default to the first one
    //     const firstWalletKey = Object.keys(wallets)[0];
    //     selectedWallet = wallets[firstWalletKey];
    //     await setSelectedWallet(selectedWallet);
    //   }
    //   if (!selectedWallet) {
    //     const address = await loadAddress();
    //     if (!address) {
    //       selectedWallet = wallets[Object.keys(wallets)[0]];
    //     } else {
    //       keys(wallets).some(key => {
    //         const someWallet = wallets[key];
    //         const found = (someWallet.addresses || []).some(account => {
    //           return toChecksumAddress(account.address) === toChecksumAddress(address!);
    //         });
    //         if (found) {
    //           selectedWallet = someWallet;
    //           logger.debug('[redux/wallets]: Found selected wallet based on loadAddress result');
    //         }
    //         return found;
    //       });
    //     }
    //   }
    //   // Recover from broken state (account address not in selected wallet)
    //   if (!addressFromKeychain) {
    //     addressFromKeychain = await loadAddress();
    //     logger.debug("[redux/wallets]: addressFromKeychain wasn't set on settings so it is being loaded from loadAddress");
    //   }
    //   const selectedAddress = selectedWallet?.addresses.find(a => {
    //     return a.visible && a.address === addressFromKeychain;
    //   });
    //   // Let's select the first visible account if we don't have a selected address
    //   if (!selectedAddress) {
    //     const allWallets = Object.values(allWalletsResult?.wallets || {});
    //     let account = null;
    //     for (const wallet of allWallets) {
    //       for (const rainbowAccount of wallet.addresses || []) {
    //         if (rainbowAccount.visible) {
    //           account = rainbowAccount;
    //           break;
    //         }
    //       }
    //     }
    //     if (!account) return;
    //     await dispatch(settingsUpdateAccountAddress(account.address));
    //     await saveAddress(account.address);
    //     logger.debug('[redux/wallets]: Selected the first visible address because there was not selected one');
    //   }
    //   const walletNames = await getWalletNames();
    //   dispatch({
    //     payload: {
    //       selected: selectedWallet,
    //       walletNames,
    //       wallets,
    //     },
    //     type: WALLETS_LOAD,
    //   });
    //   return wallets;
    // } catch (error) {
    //   logger.error(new RainbowError('[redux/wallets]: Exception during walletsLoadState'), {
    //     message: (error as Error)?.message,
    //   });
    // }
  },

  createAccount: data => {
    // const { wallets } = getState().wallets;
    // const newWallets = { ...wallets };
    // let index = 0;
    // newWallets[id].addresses.forEach(account => (index = Math.max(index, account.index)));
    // const newIndex = index + 1;
    // const account = (await generateAccount(id, newIndex))!;
    // const walletColorIndex = color !== null ? color : addressHashedColorIndex(account!.address)!;
    // newWallets[id].addresses.push({
    //   address: account.address,
    //   avatar: null,
    //   color: walletColorIndex,
    //   index: newIndex,
    //   label: name,
    //   visible: true,
    // });
    // await dispatch(updateWebDataEnabled(true, account.address));
    // setPreference(PreferenceActionType.init, 'profile', account.address, {
    //   accountColor: lightModeThemeColors.avatarBackgrounds[walletColorIndex],
    //   accountSymbol: addressHashedEmoji(account.address),
    // });
    // // Save all the wallets
    // saveAllWallets(newWallets);
    // // Set the address selected (KEYCHAIN)
    // await saveAddress(account.address);
    // // Set the wallet selected (KEYCHAIN)
    // await setSelectedWallet(newWallets[id]);
    // dispatch({
    //   payload: { selected: newWallets[id], wallets: newWallets },
    //   type: WALLETS_ADDED_ACCOUNT,
    // });
    // return newWallets;
  },

  setAllWalletsWithIdsAsBackedUp: (ids, method, backupFile) => {
    // const { wallets, selected } = getState().wallets;
    // const newWallets = { ...wallets };
    // let backupDate = Date.now();
    // if (backupFile) {
    //   backupDate = parseTimestampFromBackupFile(backupFile) ?? Date.now();
    // }
    // walletIds.forEach(walletId => {
    //   newWallets[walletId] = {
    //     ...newWallets[walletId],
    //     backedUp: true,
    //     backupDate,
    //     backupFile,
    //     backupType: method,
    //   };
    // });
    // await dispatch(walletsUpdate(newWallets));
    // if (selected?.id && walletIds.includes(selected?.id)) {
    //   await dispatch(walletsSetSelected(newWallets[selected.id]));
    // }
  },

  setWalletBackedUp: (id, method, backupFile) => {
    // const { wallets, selected } = getState().wallets;
    // const newWallets = { ...wallets };
    // let backupDate = Date.now();
    // if (backupFile) {
    //   backupDate = parseTimestampFromBackupFile(backupFile) ?? Date.now();
    // }
    // newWallets[walletId] = {
    //   ...newWallets[walletId],
    //   backedUp: true,
    //   backupDate,
    //   backupFile,
    //   backupType: method,
    // };
    // await dispatch(walletsUpdate(newWallets));
    // if (selected?.id === walletId) {
    //   await dispatch(walletsSetSelected(newWallets[walletId]));
    // }
  },

  clearAllWalletsBackupStatus: () => {
    //   const { wallets } = getState().wallets;
    // const newWallets = { ...wallets };
    // Object.keys(newWallets).forEach(key => {
    //   newWallets[key].backedUp = undefined;
    //   newWallets[key].backupDate = undefined;
    //   newWallets[key].backupFile = undefined;
    //   newWallets[key].backupType = undefined;
    // });
    // await dispatch(walletsUpdate(newWallets));
  },

  addressSetSelected: (address: string) => {
    saveAddress(address);
  },
}));

/**
 * Fetches ENS avatars for the given `walletsState` and updates state
 * accordingly.
 *
 * @param walletsState The wallets to use for fetching avatars.
 * @param dispatch The dispatch.
 */
export const getWalletENSAvatars = async (
  walletsState: Pick<WalletsState, 'wallets' | 'walletNames' | 'selected'>,
  dispatch: ThunkDispatch<AppState, unknown, never>
) => {
  // const { wallets, walletNames, selected } = walletsState;
  // const walletKeys = Object.keys(wallets!);
  // let updatedWallets:
  //   | {
  //       [key: string]: RainbowWallet;
  //     }
  //   | undefined;
  // let promises: Promise<{
  //   account: RainbowAccount;
  //   ensChanged: boolean;
  //   key: string;
  // }>[] = [];
  // walletKeys.forEach(key => {
  //   const wallet = wallets![key];
  //   const innerPromises = wallet?.addresses?.map(async account => {
  //     const ens = await fetchReverseRecord(account.address);
  //     const currentENSName = walletNames[account.address];
  //     if (ens) {
  //       const isNewEnsName = currentENSName !== ens;
  //       const avatar = await fetchENSAvatar(ens);
  //       const newImage = avatar?.imageUrl || null;
  //       return {
  //         account: {
  //           ...account,
  //           image: newImage,
  //           label: isNewEnsName ? ens : account.label,
  //         },
  //         ensChanged: newImage !== account.image || isNewEnsName,
  //         key,
  //       };
  //     } else if (currentENSName) {
  //       // if user had an ENS but now is gone
  //       return {
  //         account: {
  //           ...account,
  //           image: account.image?.startsWith('~') || account.image?.startsWith('file') ? account.image : null, // if the user had an ens but the image it was a local image
  //           label: '',
  //         },
  //         ensChanged: true,
  //         key,
  //       };
  //     } else {
  //       return {
  //         account,
  //         ensChanged: false,
  //         key,
  //       };
  //     }
  //   });
  //   promises = promises.concat(innerPromises);
  // });
  // const newAccounts = await Promise.all(promises);
  // newAccounts.forEach(({ account, key, ensChanged }) => {
  //   if (!ensChanged) return;
  //   const addresses = wallets?.[key]?.addresses;
  //   const index = addresses?.findIndex(({ address }) => address === account.address);
  //   addresses!.splice(index!, 1, account);
  //   updatedWallets = {
  //     ...(updatedWallets ?? wallets),
  //     [key]: {
  //       ...wallets![key],
  //       addresses: addresses!,
  //     },
  //   };
  // });
  // if (updatedWallets) {
  //   dispatch(walletsUpdate(updatedWallets));
  // }
};

/**
 * Fetches wallet ENS avatars using `getWalletENSAvatars` with the current
 * wallets in state.
 */
export const fetchWalletENSAvatars = () => async (dispatch: ThunkDispatch<AppState, unknown, never>, getState: AppGetState) =>
  getWalletENSAvatars(getState().wallets, dispatch);

/**
 * Fetches wallet names and updates storage and state.
 */
export const fetchWalletNames = () => async (dispatch: Dispatch<WalletsUpdateNamesAction>, getState: AppGetState) => {
  const { wallets } = getState().wallets;
  const updatedWalletNames: { [address: string]: string } = {};

  // Fetch ENS names
  await Promise.all(
    Object.values(wallets || {}).flatMap(wallet => {
      const visibleAccounts = (wallet.addresses || []).filter(address => address.visible);
      return visibleAccounts.map(async account => {
        try {
          const ens = await fetchReverseRecordWithRetry(account.address);
          if (ens && ens !== account.address) {
            updatedWalletNames[account.address] = ens;
          }
          // eslint-disable-next-line no-empty
        } catch (error) {}
        return account;
      });
    })
  );

  dispatch({
    payload: updatedWalletNames,
    type: WALLETS_UPDATE_NAMES,
  });
  saveWalletNames(updatedWalletNames);
};

/**
 * Checks the validity of the keychain and updates storage and state
 * accordingly if the keychain is unhealthy.
 */
export const checkKeychainIntegrity = () => async (dispatch: ThunkDispatch<AppState, unknown, never>, getState: AppGetState) => {
  try {
    let healthyKeychain = true;
    logger.debug('[redux/wallets]: Starting keychain integrity checks');

    const hasAddress = await hasKey(addressKey);
    if (hasAddress) {
      logger.debug('[redux/wallets]: address is ok');
    } else {
      healthyKeychain = false;
      logger.debug(`[redux/wallets]: address is missing: ${hasAddress}`);
    }

    const hasOldSeedPhraseMigratedFlag = await hasKey(oldSeedPhraseMigratedKey);
    if (hasOldSeedPhraseMigratedFlag) {
      logger.debug('[redux/wallets]: migrated flag is OK');
    } else {
      logger.debug(`[redux/wallets]: migrated flag is present: ${hasOldSeedPhraseMigratedFlag}`);
    }

    const hasOldSeedphrase = await hasKey(seedPhraseKey);
    if (hasOldSeedphrase) {
      logger.debug('[redux/wallets]: old seed is still present!');
    } else {
      logger.debug(`[redux/wallets]: old seed is present: ${hasOldSeedphrase}`);
    }

    const { wallets, selected } = getState().wallets;
    if (!wallets) {
      logger.warn('[redux/wallets]: wallets are missing from redux');
    }

    if (!selected) {
      logger.warn('[redux/wallets]: selectedWallet is missing from redux');
    }

    const nonReadOnlyWalletKeys = keys(wallets).filter(key => wallets![key].type !== WalletTypes.readOnly);

    for (const key of nonReadOnlyWalletKeys) {
      let healthyWallet = true;
      const wallet = wallets![key];

      const seedKeyFound = await hasKey(`${key}_${seedPhraseKey}`);
      if (!seedKeyFound) {
        healthyWallet = false;
        logger.warn('[redux/wallets]: seed key is missing');
      } else {
        logger.debug('[redux/wallets]: seed key is present');
      }

      for (const account of wallet.addresses || []) {
        const pkeyFound = await hasKey(`${account.address}_${privateKeyKey}`);
        if (!pkeyFound) {
          healthyWallet = false;
          logger.warn(`[redux/wallets]: pkey is missing`);
        } else {
          logger.debug(`[redux/wallets]: pkey is present`);
        }
      }

      // Handle race condition:
      // A wallet is NOT damaged if:
      // - it's not imported
      // - and hasn't been migrated yet
      // - and the old seedphrase is still there
      if (!wallet.imported && !hasOldSeedPhraseMigratedFlag && hasOldSeedphrase) {
        healthyWallet = true;
      }

      if (!healthyWallet) {
        logger.warn('[redux/wallets]: declaring wallet unhealthy...');
        healthyKeychain = false;
        wallet.damaged = true;
        await dispatch(walletsUpdate(wallets!));
        // Update selected wallet if needed
        if (wallet.id === selected!.id) {
          logger.warn('[redux/wallets]: declaring selected wallet unhealthy...');
          await dispatch(walletsSetSelected(wallets![wallet.id]));
        }
        logger.debug('[redux/wallets]: done updating wallets');
      }
    }
    if (!healthyKeychain) {
      captureMessage('Keychain Integrity is not OK');
    }
    logger.debug('[redux/wallets]: check completed');
    await saveKeychainIntegrityState('done');
  } catch (e) {
    logger.error(new RainbowError("[redux/wallets]: error thrown'"), {
      message: (e as Error)?.message,
    });
    captureMessage('Error running keychain integrity checks');
  }
};
