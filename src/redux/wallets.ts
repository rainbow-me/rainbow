import { captureMessage } from '@sentry/react-native';
import { toChecksumAddress } from 'ethereumjs-util';
import { isEmpty, keys } from 'lodash';
import { Dispatch } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import { backupUserDataIntoCloud, fetchUserDataFromCloud } from '../handlers/cloudBackup';
import { saveKeychainIntegrityState } from '../handlers/localstorage/globalSettings';
import { getWalletNames, saveWalletNames } from '../handlers/localstorage/walletNames';
import WalletBackupTypes from '../helpers/walletBackupTypes';
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

// -- Types ---------------------------------------- //

/**
 * The current state of the `wallets` reducer.
 */
interface WalletsState {
  /**
   * The current loading state of the wallet.
   */
  isWalletLoading: any;

  /**
   * The currently selected wallet.
   */
  selected: RainbowWallet | undefined;

  /**
   * An object mapping addresses to wallet names.
   */
  walletNames: { [address: string]: string };

  /**
   * An object mapping addresses to wallet objects.
   */
  wallets: { [id: string]: RainbowWallet } | null;
}

/**
 * An action for the `wallets` reducer.
 */
type WalletsAction =
  | WalletsSetIsLoadingAction
  | WalletsSetSelectedAction
  | WalletsUpdateAction
  | WalletsUpdateNamesAction
  | WalletsLoadAction
  | WalletsAddedAccountAction;

/**
 * An action that sets the wallet loading state.
 */
interface WalletsSetIsLoadingAction {
  type: typeof WALLETS_SET_IS_LOADING;
  payload: WalletsState['isWalletLoading'];
}

/**
 * An action that sets the selected wallet.
 */
interface WalletsSetSelectedAction {
  type: typeof WALLETS_SET_SELECTED;
  payload: WalletsState['selected'];
}

/**
 * An acion that updates the `wallets` in state.
 */
interface WalletsUpdateAction {
  type: typeof WALLETS_UPDATE;
  payload: WalletsState['wallets'];
}

/**
 * An action that updates `walletNames` in state.
 */
interface WalletsUpdateNamesAction {
  type: typeof WALLETS_UPDATE_NAMES;
  payload: WalletsState['walletNames'];
}

/**
 * An action that loads new wallet information.
 */
interface WalletsLoadAction {
  type: typeof WALLETS_LOAD;
  payload: Pick<WalletsState, 'selected' | 'walletNames' | 'wallets'>;
}

/**
 * An action for adding a new account to the `wallets` reducer's state.
 */
interface WalletsAddedAccountAction {
  type: typeof WALLETS_ADDED_ACCOUNT;
  payload: Pick<WalletsState, 'selected' | 'wallets'>;
}

// -- Constants --------------------------------------- //
const WALLETS_ADDED_ACCOUNT = 'wallets/WALLETS_ADDED_ACCOUNT';
const WALLETS_LOAD = 'wallets/ALL_WALLETS_LOAD';
const WALLETS_UPDATE = 'wallets/ALL_WALLETS_UPDATE';
const WALLETS_UPDATE_NAMES = 'wallets/WALLETS_UPDATE_NAMES';
const WALLETS_SET_IS_LOADING = 'wallets/WALLETS_SET_IS_LOADING';
const WALLETS_SET_SELECTED = 'wallets/SET_SELECTED';

// -- Actions ---------------------------------------- //

/**
 * Loads wallet information from storage and updates state accordingly.
 */
export const walletsLoadState =
  (profilesEnabled = false) =>
  async (dispatch: ThunkDispatch<AppState, unknown, WalletsLoadAction>, getState: AppGetState) => {
    try {
      const { accountAddress } = getState().settings;
      let addressFromKeychain: string | null = accountAddress;
      const allWalletsResult = await getAllWallets();
      const wallets = allWalletsResult?.wallets || {};
      if (isEmpty(wallets)) return;
      const selected = await getSelectedWallet();
      // Prevent irrecoverable state (no selected wallet)
      let selectedWallet = selected?.wallet;
      // Check if the selected wallet is among all the wallets
      if (selectedWallet && !wallets[selectedWallet.id]) {
        // If not then we should clear it and default to the first one
        const firstWalletKey = Object.keys(wallets)[0];
        selectedWallet = wallets[firstWalletKey];
        await setSelectedWallet(selectedWallet);
      }

      if (!selectedWallet) {
        const address = await loadAddress();
        if (!address) {
          selectedWallet = wallets[Object.keys(wallets)[0]];
        } else {
          keys(wallets).some(key => {
            const someWallet = wallets[key];
            const found = someWallet.addresses.some(account => {
              return toChecksumAddress(account.address) === toChecksumAddress(address!);
            });
            if (found) {
              selectedWallet = someWallet;
              logger.info('Found selected wallet based on loadAddress result');
            }
            return found;
          });
        }
      }

      // Recover from broken state (account address not in selected wallet)
      if (!addressFromKeychain) {
        addressFromKeychain = await loadAddress();
        logger.info("addressFromKeychain wasn't set on settings so it is being loaded from loadAddress");
      }

      const selectedAddress = selectedWallet?.addresses.find(a => {
        return a.visible && a.address === addressFromKeychain;
      });

      // Let's select the first visible account if we don't have a selected address
      if (!selectedAddress) {
        const allWallets = Object.values(allWalletsResult?.wallets || {});
        let account = null;
        for (const wallet of allWallets) {
          for (const rainbowAccount of wallet.addresses) {
            if (rainbowAccount.visible) {
              account = rainbowAccount;
              break;
            }
          }
        }
        if (!account) return;
        await dispatch(settingsUpdateAccountAddress(account.address));
        await saveAddress(account.address);
        logger.info('Selected the first visible address because there was not selected one');
      }

      const walletNames = await getWalletNames();
      dispatch({
        payload: {
          selected: selectedWallet,
          walletNames,
          wallets,
        },
        type: WALLETS_LOAD,
      });

      return wallets;
    } catch (error) {
      logger.error(new RainbowError('Exception during walletsLoadState'), {
        message: (error as Error)?.message,
      });
    }
  };

/**
 * Saves new wallets to storage and updates state accordingly.
 *
 * @param wallets The new wallets.
 */
export const walletsUpdate = (wallets: { [key: string]: RainbowWallet }) => async (dispatch: Dispatch<WalletsUpdateAction>) => {
  await saveAllWallets(wallets);
  dispatch({
    payload: wallets,
    type: WALLETS_UPDATE,
  });
};

/**
 * Sets the selected wallet in storage and updates state accordingly.
 *
 * @param wallet The wallet to mark as selected.
 */
export const walletsSetSelected = (wallet: RainbowWallet) => async (dispatch: Dispatch<WalletsSetSelectedAction>) => {
  await setSelectedWallet(wallet);
  dispatch({
    payload: wallet,
    type: WALLETS_SET_SELECTED,
  });
};

/**
 * Marks all wallets with passed ids as backed-up
 * using a specified method and file in storage
 * and updates state accordingly.
 *
 * @param walletIds An array of wallet IDs to modify.
 * @param method The backup type used.
 * @param backupFile The backup file, if present.
 * @param updateUserMetadata Whether to update user metadata.
 */
export const setAllWalletsWithIdsAsBackedUp =
  (
    walletIds: RainbowWallet['id'][],
    method: RainbowWallet['backupType'],
    backupFile: RainbowWallet['backupFile'] = null,
    updateUserMetadata = true
  ) =>
  async (dispatch: ThunkDispatch<AppState, unknown, never>, getState: AppGetState) => {
    const { wallets, selected } = getState().wallets;
    const newWallets = { ...wallets };

    walletIds.forEach(walletId => {
      newWallets[walletId] = {
        ...newWallets[walletId],
        backedUp: true,
        backupDate: Date.now(),
        backupFile,
        backupType: method,
      };
    });

    await dispatch(walletsUpdate(newWallets));
    if (selected?.id && walletIds.includes(selected?.id)) {
      await dispatch(walletsSetSelected(newWallets[selected.id]));
    }

    if (method === WalletBackupTypes.cloud && updateUserMetadata) {
      try {
        await backupUserDataIntoCloud({ wallets: newWallets });
      } catch (e) {
        logger.error(new RainbowError('Saving multiple wallets UserData to cloud failed.'), {
          message: (e as Error)?.message,
        });
        throw e;
      }
    }
  };

/**
 * Marks a wallet as backed-up using a specified method and file in storage
 * and updates state accordingly.
 *
 * @param walletId The ID of the wallet to modify.
 * @param method The backup type used.
 * @param backupFile The backup file, if present.
 * @param updateUserMetadata Whether to update user metadata.
 */
export const setWalletBackedUp =
  (
    walletId: RainbowWallet['id'],
    method: RainbowWallet['backupType'],
    backupFile: RainbowWallet['backupFile'] = null,
    updateUserMetadata = true
  ) =>
  async (dispatch: ThunkDispatch<AppState, unknown, never>, getState: AppGetState) => {
    const { wallets, selected } = getState().wallets;
    const newWallets = { ...wallets };
    newWallets[walletId] = {
      ...newWallets[walletId],
      backedUp: true,
      backupDate: Date.now(),
      backupFile,
      backupType: method,
    };

    await dispatch(walletsUpdate(newWallets));
    if (selected!.id === walletId) {
      await dispatch(walletsSetSelected(newWallets[walletId]));
    }

    if (method === WalletBackupTypes.cloud && updateUserMetadata) {
      try {
        await backupUserDataIntoCloud({ wallets: newWallets });
      } catch (e) {
        logger.error(new RainbowError('Saving wallet UserData to cloud failed.'), {
          message: (e as Error)?.message,
        });
        throw e;
      }
    }
  };

/**
 * Grabs user data stored in the cloud and based on this data marks wallets
 * as backed up or not
 */
export const updateWalletBackupStatusesBasedOnCloudUserData =
  () => async (dispatch: ThunkDispatch<AppState, unknown, never>, getState: AppGetState) => {
    const { wallets, selected } = getState().wallets;
    const newWallets = { ...wallets };

    let currentUserData: { wallets: { [p: string]: RainbowWallet } } | undefined;
    try {
      currentUserData = await fetchUserDataFromCloud();
    } catch (error) {
      logger.error(new RainbowError('There was an error when trying to update wallet backup statuses'), {
        error: (error as Error).message,
      });
      return;
    }
    if (currentUserData === undefined) {
      return;
    }

    // build hashmap of address to wallet based on backup metadata
    const addressToWalletLookup = new Map<string, RainbowWallet>();
    Object.values(currentUserData.wallets).forEach(wallet => {
      wallet.addresses.forEach(account => {
        addressToWalletLookup.set(account.address, wallet);
      });
    });

    /*
    marking wallet as already backed up if all addresses are backed up properly
    and linked to the same wallet
    
    we assume it's not backed up if:
    * we don't have an address in the backup metadata
    * we have an address in the backup metadata, but it's linked to multiple
      wallet ids (should never happen, but that's a sanity check)
  */
    Object.values(newWallets).forEach(wallet => {
      const localWalletId = wallet.id;

      let relatedCloudWalletId: string | null = null;
      for (const account of wallet.addresses) {
        const walletDataForCurrentAddress = addressToWalletLookup.get(account.address);
        if (!walletDataForCurrentAddress) {
          return;
        }
        if (relatedCloudWalletId === null) {
          relatedCloudWalletId = walletDataForCurrentAddress.id;
        } else if (relatedCloudWalletId !== walletDataForCurrentAddress.id) {
          logger.warn(
            'Wallet address is linked to multiple or different accounts in the cloud backup metadata. It could mean that there is an issue with the cloud backup metadata.'
          );
          return;
        }
      }

      if (relatedCloudWalletId === null) {
        return;
      }

      // update only if we checked the wallet is actually backed up
      const cloudBackupData = currentUserData?.wallets[relatedCloudWalletId];
      if (cloudBackupData) {
        newWallets[localWalletId] = {
          ...newWallets[localWalletId],
          backedUp: cloudBackupData.backedUp,
          backupDate: cloudBackupData.backupDate,
          backupFile: cloudBackupData.backupFile,
          backupType: cloudBackupData.backupType,
        };
      }
    });

    await dispatch(walletsUpdate(newWallets));
    if (selected?.id) {
      await dispatch(walletsSetSelected(newWallets[selected.id]));
    }
  };

/**
 * Clears backup status for all users' wallets
 */
export const clearAllWalletsBackupStatus = () => async (dispatch: ThunkDispatch<AppState, unknown, never>, getState: AppGetState) => {
  const { wallets } = getState().wallets;
  const newWallets = { ...wallets };
  Object.keys(newWallets).forEach(key => {
    newWallets[key].backedUp = undefined;
    newWallets[key].backupDate = undefined;
    newWallets[key].backupFile = undefined;
    newWallets[key].backupType = undefined;
  });

  await dispatch(walletsUpdate(newWallets));
};

/**
 * Updates the selected address in state.
 * @param address The new selected address.
 */
export const addressSetSelected = (address: string) => () => saveAddress(address);

/**
 * Adds a new address to an existing wallet in storage and state.
 *
 * @param id The wallet ID to update.
 * @param color The color for the new address.
 * @param name The name for the new address.
 * @returns Within a dispatch, a new mapping from wallet IDs to wallet objects.
 */
export const createAccountForWallet =
  (id: RainbowWallet['id'], color: RainbowWallet['color'], name: RainbowWallet['name']) =>
  async (dispatch: ThunkDispatch<AppState, unknown, WalletsAddedAccountAction>, getState: AppGetState) => {
    const { wallets } = getState().wallets;
    const newWallets = { ...wallets };
    let index = 0;
    newWallets[id].addresses.forEach(account => (index = Math.max(index, account.index)));
    const newIndex = index + 1;
    const account = (await generateAccount(id, newIndex))!;
    const walletColorIndex = color !== null ? color : addressHashedColorIndex(account!.address)!;
    newWallets[id].addresses.push({
      address: account.address,
      avatar: null,
      color: walletColorIndex,
      index: newIndex,
      label: name,
      visible: true,
    });

    await dispatch(updateWebDataEnabled(true, account.address));

    setPreference(PreferenceActionType.init, 'profile', account.address, {
      accountColor: lightModeThemeColors.avatarBackgrounds[walletColorIndex],
      accountSymbol: addressHashedEmoji(account.address),
    });

    // Save all the wallets
    saveAllWallets(newWallets);
    // Set the address selected (KEYCHAIN)
    await saveAddress(account.address);
    // Set the wallet selected (KEYCHAIN)
    await setSelectedWallet(newWallets[id]);

    dispatch({
      payload: { selected: newWallets[id], wallets: newWallets },
      type: WALLETS_ADDED_ACCOUNT,
    });

    return newWallets;
  };

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
  const { wallets, walletNames, selected } = walletsState;
  const walletKeys = Object.keys(wallets!);
  let updatedWallets:
    | {
        [key: string]: RainbowWallet;
      }
    | undefined;
  let promises: Promise<{
    account: RainbowAccount;
    ensChanged: boolean;
    key: string;
  }>[] = [];
  walletKeys.forEach(key => {
    const wallet = wallets![key];
    const innerPromises = wallet?.addresses?.map(async account => {
      const ens = await fetchReverseRecord(account.address);
      const currentENSName = walletNames[account.address];
      if (ens) {
        const isNewEnsName = currentENSName !== ens;
        const avatar = await fetchENSAvatar(ens);
        const newImage = avatar?.imageUrl || null;
        return {
          account: {
            ...account,
            image: newImage,
            label: isNewEnsName ? ens : account.label,
          },
          ensChanged: newImage !== account.image || isNewEnsName,
          key,
        };
      } else if (currentENSName) {
        // if user had an ENS but now is gone
        return {
          account: {
            ...account,
            image: account.image?.startsWith('~') || account.image?.startsWith('file') ? account.image : null, // if the user had an ens but the image it was a local image
            label: '',
          },
          ensChanged: true,
          key,
        };
      } else {
        return {
          account,
          ensChanged: false,
          key,
        };
      }
    });
    promises = promises.concat(innerPromises);
  });

  const newAccounts = await Promise.all(promises);
  newAccounts.forEach(({ account, key, ensChanged }) => {
    if (!ensChanged) return;
    const addresses = wallets?.[key]?.addresses;
    const index = addresses?.findIndex(({ address }) => address === account.address);
    addresses!.splice(index!, 1, account);
    updatedWallets = {
      ...(updatedWallets ?? wallets),
      [key]: {
        ...wallets![key],
        addresses: addresses!,
      },
    };
  });
  if (updatedWallets) {
    dispatch(walletsUpdate(updatedWallets));
  }
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
    Object.values(wallets ?? {}).flatMap(wallet => {
      const visibleAccounts = wallet.addresses?.filter(address => address.visible);
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
    logger.info('[KeychainIntegrityCheck]: starting checks');

    const hasAddress = await hasKey(addressKey);
    if (hasAddress) {
      logger.info('[KeychainIntegrityCheck]: address is ok');
    } else {
      healthyKeychain = false;
      logger.info(`[KeychainIntegrityCheck]: address is missing: ${hasAddress}`);
    }

    const hasOldSeedPhraseMigratedFlag = await hasKey(oldSeedPhraseMigratedKey);
    if (hasOldSeedPhraseMigratedFlag) {
      logger.info('[KeychainIntegrityCheck]: migrated flag is OK');
    } else {
      logger.info(`[KeychainIntegrityCheck]: migrated flag is present: ${hasOldSeedPhraseMigratedFlag}`);
    }

    const hasOldSeedphrase = await hasKey(seedPhraseKey);
    if (hasOldSeedphrase) {
      logger.info('[KeychainIntegrityCheck]: old seed is still present!');
    } else {
      logger.info(`[KeychainIntegrityCheck]: old seed is present: ${hasOldSeedphrase}`);
    }

    const { wallets, selected } = getState().wallets;
    if (!wallets) {
      logger.warn('[KeychainIntegrityCheck]: wallets are missing from redux');
    }

    if (!selected) {
      logger.warn('[KeychainIntegrityCheck]: selectedWallet is missing from redux');
    }

    const nonReadOnlyWalletKeys = keys(wallets).filter(key => wallets![key].type !== WalletTypes.readOnly);

    for (const key of nonReadOnlyWalletKeys) {
      let healthyWallet = true;
      const wallet = wallets![key];

      const seedKeyFound = await hasKey(`${key}_${seedPhraseKey}`);
      if (!seedKeyFound) {
        healthyWallet = false;
        logger.warn('[KeychainIntegrityCheck]: seed key is missing');
      } else {
        logger.info('[KeychainIntegrityCheck]: seed key is present');
      }

      for (const account of wallet.addresses) {
        const pkeyFound = await hasKey(`${account.address}_${privateKeyKey}`);
        if (!pkeyFound) {
          healthyWallet = false;
          logger.warn(`[KeychainIntegrityCheck]: pkey is missing`);
        } else {
          logger.info(`[KeychainIntegrityCheck]: pkey is present`);
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
        logger.warn('[KeychainIntegrityCheck]: declaring wallet unhealthy...');
        healthyKeychain = false;
        wallet.damaged = true;
        await dispatch(walletsUpdate(wallets!));
        // Update selected wallet if needed
        if (wallet.id === selected!.id) {
          logger.warn('[KeychainIntegrityCheck]: declaring selected wallet unhealthy...');
          await dispatch(walletsSetSelected(wallets![wallet.id]));
        }
        logger.info('[KeychainIntegrityCheck]: done updating wallets');
      }
    }
    if (!healthyKeychain) {
      captureMessage('Keychain Integrity is not OK');
    }
    logger.info('[KeychainIntegrityCheck]: check completed');
    await saveKeychainIntegrityState('done');
  } catch (e) {
    logger.error(new RainbowError("[KeychainIntegrityCheck]: error thrown'"), {
      message: (e as Error)?.message,
    });
    captureMessage('Error running keychain integrity checks');
  }
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE: WalletsState = {
  isWalletLoading: null,
  selected: undefined,
  walletNames: {},
  wallets: null,
};

export default (state = INITIAL_STATE, action: WalletsAction): WalletsState => {
  switch (action.type) {
    case WALLETS_SET_IS_LOADING:
      return { ...state, isWalletLoading: action.payload };
    case WALLETS_SET_SELECTED:
      return { ...state, selected: action.payload };
    case WALLETS_UPDATE:
      return { ...state, wallets: action.payload };
    case WALLETS_UPDATE_NAMES:
      return { ...state, walletNames: action.payload };
    case WALLETS_LOAD:
      return {
        ...state,
        selected: action.payload.selected,
        walletNames: action.payload.walletNames,
        wallets: action.payload.wallets,
      };
    case WALLETS_ADDED_ACCOUNT:
      return {
        ...state,
        selected: action.payload.selected,
        wallets: action.payload.wallets,
      };
    default:
      return state;
  }
};
