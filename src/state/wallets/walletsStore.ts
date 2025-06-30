import { saveKeychainIntegrityState } from '@/handlers/localstorage/globalSettings';
import { ensureValidHex, isValidHex } from '@/handlers/web3';
import { removeFirstEmojiFromString, returnStringFirstEmoji } from '@/helpers/emojiHandler';
import WalletTypes from '@/helpers/walletTypes';
import { fetchENSAvatarWithRetry } from '@/hooks/useENSAvatar';
import { logger, RainbowError } from '@/logger';
import { parseTimestampFromBackupFile } from '@/model/backup';
import { hasKey, wipeKeychain } from '@/model/keychain';
import { PreferenceActionType, setPreference } from '@/model/preferences';
import {
  AllRainbowWallets,
  cleanUpWalletKeys,
  generateAccount,
  getAllWallets,
  getSelectedWallet as getSelectedWalletFromKeychain,
  loadAddress,
  RainbowAccount,
  RainbowWallet,
  resetSelectedWallet as resetSelectedWalletInKeychain,
  saveAddress,
  saveAllWallets,
  setSelectedWallet as setSelectedWalletInKeychain,
} from '@/model/wallet';
import { updateWebDataEnabled } from '@/redux/showcaseTokens';
import store from '@/redux/store';
import { lightModeThemeColors } from '@/styles';
import { useTheme } from '@/theme';
import { isLowerCaseMatch, time } from '@/utils';
import { address as addressAbbreviation } from '@/utils/abbreviations';
import { addressKey, oldSeedPhraseMigratedKey, privateKeyKey, seedPhraseKey } from '@/utils/keychainConstants';
import { addressHashedColorIndex, addressHashedEmoji, fetchReverseRecordWithRetry, isValidImagePath } from '@/utils/profileUtils';
import { captureMessage } from '@sentry/react-native';
import { dequal } from 'dequal';
import { toChecksumAddress } from 'ethereumjs-util';
import { keys } from 'lodash';
import { useMemo } from 'react';
import { Address } from 'viem';
import { createRainbowStore } from '../internal/createRainbowStore';

interface AccountProfileInfo {
  accountAddress: string;
  accountColor: number;
  accountENS?: string;
  accountImage?: string | null;
  accountName?: string;
  accountSymbol?: string | false;
}

type WalletNames = { [address: string]: string };

interface WalletsState {
  walletReady: boolean;
  setWalletReady: () => void;

  selected: RainbowWallet | null;
  setSelectedWallet: (wallet: RainbowWallet, address?: string) => Promise<void>;

  walletNames: WalletNames;
  wallets: AllRainbowWallets;
  updateWallets: (wallets: AllRainbowWallets) => Promise<void>;

  updateAccount: (walletId: string, account: Partial<RainbowAccount> & Pick<RainbowAccount, 'address'>) => Promise<RainbowWallet | null>;

  loadWallets: () => Promise<AllRainbowWallets | void>;

  createAccount: (data: { id: RainbowWallet['id']; name: RainbowWallet['name']; color: RainbowWallet['color'] | null }) => Promise<{
    [id: string]: RainbowWallet;
  }>;

  setAllWalletsWithIdsAsBackedUp: (
    ids: RainbowWallet['id'][],
    method: RainbowWallet['backupType'],
    backupFile?: RainbowWallet['backupFile']
  ) => Promise<void>;

  setWalletBackedUp: (id: RainbowWallet['id'], method: RainbowWallet['backupType'], backupFile?: RainbowWallet['backupFile']) => void;

  clearAllWalletsBackupStatus: () => void;

  accountAddress: Address;
  setAccountAddress: (address: Address) => void;

  getAccountProfileInfo: () => AccountProfileInfo;

  refreshWalletInfo: (props?: { skipENS?: boolean }) => Promise<void>;

  checkKeychainIntegrity: () => Promise<void>;

  getIsDamagedWallet: () => boolean;
  getIsReadOnlyWallet: () => boolean;
  getIsHardwareWallet: () => boolean;
  getWalletWithAccount: (accountAddress: string) => RainbowWallet | undefined;

  clearWalletState: (options?: { resetKeychain?: boolean }) => Promise<void>;
}

const INITIAL_ADDRESS = '' as Address;

export const useWalletsStore = createRainbowStore<WalletsState>(
  (set, get) => ({
    getIsDamagedWallet: () => !!get().selected?.damaged,
    getIsReadOnlyWallet: () => get().selected?.type === WalletTypes.readOnly,
    getIsHardwareWallet: () => !!get().selected?.deviceId,

    selected: null,
    async setSelectedWallet(wallet, address) {
      if (address) {
        const accountAddress = ensureValidHex(address);
        saveAddress(accountAddress);
      }
      setSelectedWalletInKeychain(wallet);

      const wallets = get().wallets;
      const walletInfo = await refreshWalletsInfo({ wallets, cachedENS: 'force' });

      // ensure not memoized
      const selected = {
        ...wallet,
      };

      if (address) {
        set({
          ...walletInfo,
          accountAddress: ensureValidHex(address),
          selected,
        });
      } else {
        set({
          ...walletInfo,
          selected,
        });
      }
    },

    walletNames: {},

    wallets: {},
    updateWallets: async walletsIn => {
      const { walletNames, wallets } = await refreshWalletsInfo({
        wallets: walletsIn,
        cachedENS: true,
      });
      await saveAllWallets(wallets);
      set({ walletNames, wallets });
    },

    async updateAccount(walletId, account) {
      const { wallets } = get();
      const wallet = wallets[walletId];
      const accounts = wallets[walletId].addresses;
      const accountIndex = accounts.findIndex(a => isLowerCaseMatch(a.address, account.address));
      const foundAccount = accounts[accountIndex];

      if (!foundAccount) {
        logger.warn(`updateAccount failed, no account! ${walletId} ${account?.address}`);
        return null;
      }

      const updatedAccount = {
        ...foundAccount,
        ...account,
      };

      const foundEmoji = returnStringFirstEmoji(updatedAccount.label);
      const defaultEmoji = addressHashedEmoji(updatedAccount.address);

      if (!foundEmoji) {
        updatedAccount.label = `${defaultEmoji} ${updatedAccount.label}`;
      }

      const updatedAccounts = accounts.map((account, index) => {
        return index === accountIndex ? updatedAccount : account;
      });

      const updatedWallet = {
        ...wallet,
        addresses: updatedAccounts,
      };

      const updatedWallets = {
        ...wallets,
        [walletId]: updatedWallet,
      } satisfies AllRainbowWallets;

      // no need to await here likely
      await updateWallets(updatedWallets);

      return updatedWallet;
    },

    refreshWalletInfo: async props => {
      const { wallets } = get();
      const info = await refreshWalletsInfo({ wallets, cachedENS: props?.skipENS });

      if (info) {
        // wallets may have changed since the refresh started so lets merge them together
        set(state => {
          // prefer the latest state
          const latestWallets = { ...state.wallets };

          // loop the refreshed wallet info
          for (const key in info.wallets) {
            const latestWallet = latestWallets[key];
            const refreshedWallet = info.wallets[key];

            // if deleted or added to latest state, no need to update
            if (!latestWallet || !refreshedWallet) {
              continue;
            }

            // update wallet with refreshed info
            latestWallets[key] = {
              ...latestWallet,
              addresses: latestWallet.addresses.map(latestAccount => {
                const refreshedAccount = refreshedWallet.addresses.find(account => account.address === latestAccount.address);

                // account has been removed, keep new state
                if (!refreshedAccount) {
                  return latestAccount;
                }

                return {
                  ...latestAccount,
                  ...refreshedAccount,
                };
              }),
            };
          }

          return {
            ...state,
            wallets: latestWallets,
          };
        });

        await saveAllWallets(get().wallets);
      }
    },

    walletReady: false,
    setWalletReady: () => {
      set({ walletReady: true });
    },

    accountAddress: INITIAL_ADDRESS,
    setAccountAddress: (accountAddress: Address) => {
      saveAddress(accountAddress);
      set({
        accountAddress,
      });
    },

    getAccountProfileInfo: () => {
      const state = get();
      const { getWalletWithAccount } = state;
      const address = state.accountAddress;
      const wallet = getWalletWithAccount(address);
      return getAccountProfileInfoFromState({ address, wallet }, state);
    },

    async clearWalletState({ resetKeychain = false } = {}) {
      if (resetKeychain) {
        await wipeKeychain();
        await cleanUpWalletKeys();
        await Promise.all([saveAddress(INITIAL_ADDRESS), resetSelectedWalletInKeychain(), saveAllWallets({})]);
      }

      set({
        wallets: {},
        accountAddress: INITIAL_ADDRESS,
        walletReady: false,
        walletNames: {},
        selected: null,
      });
    },

    // this runs every time we create a wallet and ensures we normalize
    // walletNames and refresh wallet info before setting we write to keychain
    // inside createWallet (see setSelectedWallet call in wallet.ts) ideally
    // we wouldn't do this and would use this store as a single source of
    // setting and managing keychain
    loadWallets: async () => {
      try {
        const [selected, loadedAccountAddress, allWalletsResult] = await Promise.all([
          getSelectedWalletFromKeychain(),
          // because createWallet() calls saveAddress() and then calls this, we re-run this after
          // it's not a good pattern, we should move createWallet and walletInit into this store
          // and then remove keychain entirely from being read after initial load
          loadAddress(),
          getAllWallets(),
        ]);

        let accountAddress: Address | null = isValidHex(loadedAccountAddress) ? loadedAccountAddress : null;
        let selectedWallet = selected?.wallet;

        const wallets = allWalletsResult?.wallets;
        if (!wallets) return;

        // repair if selectedWallet not in wallets
        if (selectedWallet && !wallets[selectedWallet.id]) {
          selectedWallet = wallets[Object.keys(wallets)[0]];
        }

        // repair if no selectedWallet
        if (!selectedWallet) {
          if (!accountAddress) {
            selectedWallet = wallets[Object.keys(wallets)[0]];
          } else {
            for (const key in wallets) {
              const someWallet = wallets[key];
              const found = (someWallet.addresses || []).some(account => {
                return toChecksumAddress(account.address) === accountAddress;
              });
              if (found) {
                selectedWallet = someWallet;
                logger.debug('[walletsStore]: Found selected wallet based on loadAddress result');
                break;
              }
            }
          }
        }

        const selectedAddress = selectedWallet?.addresses.find(a => {
          return a.visible && a.address === accountAddress;
        });

        // repair if we can't find accountAddress in selectedWallet
        if (!selectedAddress && allWalletsResult?.wallets) {
          let account = null;
          for (const wallet of Object.values(allWalletsResult.wallets)) {
            for (const rainbowAccount of wallet.addresses || []) {
              if (rainbowAccount.visible) {
                account = rainbowAccount;
                break;
              }
            }
          }
          if (!account) return;
          if (isValidHex(account.address)) {
            accountAddress = account.address;
          }
          logger.debug('[walletsStore]: Selected the first visible address because there was not selected one');
        }

        if (!selectedWallet) {
          logger.error(new RainbowError('[walletsStore]: No selectedWallet ever found'));
          return;
        }

        set({ wallets });
        await setSelectedWallet(selectedWallet, accountAddress ? ensureValidHex(accountAddress) : undefined);

        return wallets;
      } catch (error) {
        logger.error(new RainbowError('[walletsStore]: Exception during walletsLoadState'), {
          message: (error as Error)?.message,
        });
      }
    },

    createAccount: async ({ id, name, color }) => {
      const { wallets } = get();

      let index = 0;
      for (const account of wallets[id].addresses) {
        index = Math.max(index, account.index);
      }

      const newIndex = index + 1;
      const account = await generateAccount(id, newIndex);
      if (!account) {
        throw new Error(`No account generated`);
      }

      const walletColorIndex = color !== null ? color : addressHashedColorIndex(account.address);
      if (walletColorIndex == null) {
        throw new Error(`No wallet color index`);
      }

      void store.dispatch(updateWebDataEnabled(true, account.address));

      setPreference(PreferenceActionType.init, 'profile', account.address, {
        accountColor: lightModeThemeColors.avatarBackgrounds[walletColorIndex],
        accountSymbol: addressHashedEmoji(account.address),
      });

      const newWallet: RainbowWallet = {
        ...wallets[id],
        addresses: [
          ...wallets[id].addresses,
          {
            address: account.address,
            avatar: null,
            color: walletColorIndex,
            index: newIndex,
            label: name,
            visible: true,
          },
        ],
      };

      await updateWallets({
        ...wallets,
        [id]: newWallet,
      });
      await setSelectedWallet(newWallet, account.address);

      return get().wallets;
    },

    setAllWalletsWithIdsAsBackedUp: async (walletIds, method, backupFile) => {
      const { wallets, selected, updateWallets, setSelectedWallet } = get();

      const newWallets = { ...wallets };

      let backupDate = Date.now();
      if (backupFile) {
        backupDate = parseTimestampFromBackupFile(backupFile) ?? Date.now();
      }

      logger.log(`setting wallets as backed up`, {
        walletIds,
      });

      walletIds.forEach(walletId => {
        newWallets[walletId] = {
          ...newWallets[walletId],
          backedUp: true,
          backupDate,
          backupFile,
          backupType: method,
        };
      });

      await updateWallets(newWallets);

      if (selected?.id && walletIds.includes(selected?.id)) {
        await setSelectedWallet(newWallets[selected.id]);
      }
    },

    setWalletBackedUp: (walletId, method, backupFile) => {
      const { wallets, selected } = get();
      const newWallets = { ...wallets };

      let backupDate = Date.now();
      if (backupFile) {
        backupDate = parseTimestampFromBackupFile(backupFile) ?? Date.now();
      }

      newWallets[walletId] = {
        ...newWallets[walletId],
        backedUp: true,
        backupDate,
        backupFile,
        backupType: method,
      };

      set({
        wallets: newWallets,
      });
      if (selected?.id === walletId) {
        set({
          selected: newWallets[walletId],
        });
      }
    },

    clearAllWalletsBackupStatus: () => {
      const { wallets } = get();
      const newWallets = { ...wallets };

      Object.keys(newWallets).forEach(key => {
        newWallets[key].backedUp = undefined;
        newWallets[key].backupDate = undefined;
        newWallets[key].backupFile = undefined;
        newWallets[key].backupType = undefined;
      });

      set({
        wallets: newWallets,
      });
    },

    checkKeychainIntegrity: async () => {
      try {
        let healthyKeychain = true;
        logger.debug('[walletsStore]: Starting keychain integrity checks');

        const hasAddress = await hasKey(addressKey);
        if (hasAddress) {
          logger.debug('[walletsStore]: address is ok');
        } else {
          healthyKeychain = false;
          logger.debug(`[walletsStore]: address is missing: ${hasAddress}`);
        }

        const hasOldSeedPhraseMigratedFlag = await hasKey(oldSeedPhraseMigratedKey);
        if (hasOldSeedPhraseMigratedFlag) {
          logger.debug('[walletsStore]: migrated flag is OK');
        } else {
          logger.debug(`[walletsStore]: migrated flag is present: ${hasOldSeedPhraseMigratedFlag}`);
        }

        const hasOldSeedphrase = await hasKey(seedPhraseKey);
        if (hasOldSeedphrase) {
          logger.debug('[walletsStore]: old seed is still present!');
        } else {
          logger.debug(`[walletsStore]: old seed is present: ${hasOldSeedphrase}`);
        }

        const { wallets, selected } = get();
        if (!wallets) {
          logger.warn('[walletsStore]: wallets are missing');
          return;
        }

        if (!selected) {
          logger.warn('[walletsStore]: selectedWallet is missing');
        }

        const nonReadOnlyWalletKeys = keys(wallets).filter(key => wallets[key].type !== WalletTypes.readOnly);

        for (const key of nonReadOnlyWalletKeys) {
          let healthyWallet = true;
          const wallet = wallets[key];

          const seedKeyFound = await hasKey(`${key}_${seedPhraseKey}`);
          if (!seedKeyFound) {
            healthyWallet = false;
            logger.warn('[walletsStore]: seed key is missing');
          } else {
            logger.debug('[walletsStore]: seed key is present');
          }

          for (const account of wallet.addresses || []) {
            const pkeyFound = await hasKey(`${account.address}_${privateKeyKey}`);
            if (!pkeyFound) {
              healthyWallet = false;
              logger.warn(`[walletsStore]: pkey is missing`);
            } else {
              logger.debug(`[walletsStore]: pkey is present`);
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
            logger.warn('[walletsStore]: declaring wallet unhealthy...');
            healthyKeychain = false;
            wallet.damaged = true;
            set({
              wallets,
            });

            // Update selected wallet if needed
            if (wallets && selected && wallet.id === selected.id) {
              logger.warn('[walletsStore]: declaring selected wallet unhealthy...');
              set({
                selected: wallets[wallet.id],
              });
            }
            logger.debug('[walletsStore]: done updating wallets');
          }
        }

        if (!healthyKeychain) {
          captureMessage('Keychain Integrity is not OK');
        }

        logger.debug('[walletsStore]: check completed');
        saveKeychainIntegrityState('done');
      } catch (e) {
        logger.error(new RainbowError("[walletsStore]: error thrown'"), {
          message: (e as Error)?.message,
        });
        captureMessage('Error running keychain integrity checks');
      }
    },

    getWalletWithAccount(accountAddress: string): RainbowWallet | undefined {
      const { wallets } = get();
      if (!wallets) {
        return;
      }

      const lowerCaseAccountAddress = accountAddress.toLowerCase();
      for (const key of Object.keys(wallets).sort()) {
        const wallet = wallets[key];
        const found = wallet.addresses?.find(account => isLowerCaseMatch(account.address, lowerCaseAccountAddress));
        if (found) {
          return wallet;
        }
      }
    },
  }),
  {
    storageKey: 'walletsStore',
    persistThrottleMs: time.seconds(1),
    partialize: state => ({
      selected: state.selected,
      accountAddress: state.accountAddress,
      wallets: state.wallets,
      walletNames: state.walletNames,
    }),
  }
);

type GetENSInfoProps = { wallets: AllRainbowWallets | null; cachedENS?: boolean | 'force' };

async function refreshWalletsInfo({ wallets, cachedENS }: GetENSInfoProps) {
  if (!wallets) {
    throw new Error(`No wallets`);
  }

  const updatedWallets: Record<string, RainbowWallet> = {};
  const updatedWalletNames: Record<string, string> = {};

  // this is imperfect still, ideally we remove walletNames entirely as a separate concept
  await Promise.all(
    Object.entries(wallets).map(async ([key, wallet]) => {
      const newAddresses = await Promise.all(
        wallet.addresses.map(async ogAccount => {
          const account = await refreshAccountInfo(ogAccount, cachedENS);
          updatedWalletNames[account.address] = account.label;
          return account;
        })
      );

      updatedWallets[key] = {
        ...wallet,
        addresses: newAddresses,
      };
    })
  );

  return {
    wallets: updatedWallets,
    walletNames: updatedWalletNames,
  };
}

// this isn't really our primary way of updating account info, and when people pull to refresh
// they get new info, so for ENS related stuff we can just check if not valid hex + has image
async function refreshAccountInfo(accountIn: RainbowAccount, cachedENS: boolean | 'force' = false): Promise<RainbowAccount> {
  const abbreviatedAddress = addressAbbreviation(accountIn.address, 4, 4);
  const defaultEmoji = addressHashedEmoji(accountIn.address);
  const defaultLabel = `${defaultEmoji} ${abbreviatedAddress}`;
  const formattedLabel = accountIn.label || defaultLabel;
  const account = {
    ...accountIn,
    label: removeFirstEmojiFromString(formattedLabel) ? formattedLabel : `${defaultEmoji} ${formattedLabel}`,
  };

  const hasDefaultLabel = account.label === defaultLabel || account.label === abbreviatedAddress;
  const hasEnoughData = typeof account.ens === 'string' || !account.image;
  const shouldCacheAccount = Boolean(cachedENS && hasEnoughData);

  if (shouldCacheAccount) {
    return account;
  }

  const ens = await fetchReverseRecordWithRetry(account.address);

  if (ens) {
    const avatar = await fetchENSAvatarWithRetry(ens);
    const newImage = avatar?.imageUrl || null;

    const shouldSetLabelToENS =
      (account.ens && account.ens !== ens) ||
      // prefer users label if they set to something other than account
      hasDefaultLabel;

    return {
      ...account,
      image: newImage,
      ens,
      label: shouldSetLabelToENS ? ens : account.label,
    };
  } else {
    // set to empty string so we know it's been fetched but not found
    // will ensure shouldCacheAccount is true next time
    account.ens = '';
  }

  return account;
}

export const useWallets = () => useWalletsStore(state => state.wallets);
export const useWallet = (id: string) => useWallets()?.[id];
export const getAccountAddress = () => useWalletsStore.getState().accountAddress;
export const getWallets = () => useWalletsStore.getState().wallets;
export const getSelectedWallet = () => useWalletsStore.getState().selected;
export const getWalletReady = () => useWalletsStore.getState().walletReady;

export const getWalletAddresses = (wallets: AllRainbowWallets) => {
  return Object.values(wallets || {}).flatMap(wallet => (wallet.addresses || []).map(account => account.address as Address));
};

export const useAccountAddress = () => useWalletsStore(state => state.accountAddress);
export const useSelectedWallet = () => useWalletsStore(state => state.selected);
export const useIsReadOnlyWallet = () => useWalletsStore(state => state.getIsReadOnlyWallet());
export const useIsHardwareWallet = () => useWalletsStore(state => state.getIsHardwareWallet());
export const useIsDamagedWallet = () => useWalletsStore(state => state.getIsDamagedWallet());

export const useWalletAddresses = () => {
  const wallets = useWallets();
  return useMemo(() => getWalletAddresses(wallets || {}), [wallets]);
};

export const isImportedWallet = (address: string): boolean => {
  const wallets = getWallets();
  if (!wallets) {
    return false;
  }
  for (const wallet of Object.values(wallets)) {
    if ((wallet.addresses || []).some(account => account.address === address)) {
      return true;
    }
  }
  return false;
};

export const useAccountProfileInfo = () => {
  const { colors } = useTheme();
  const info = useWalletsStore(state => state.getAccountProfileInfo(), dequal);

  return useMemo(() => {
    return {
      ...info,
      accountColorHex: info?.accountColor ? colors.avatarBackgrounds[info.accountColor] : '',
    };
  }, [colors.avatarBackgrounds, info]);
};

export const getAccountProfileInfo = (props: { address: string; wallet?: RainbowWallet }) => {
  return getAccountProfileInfoFromState(props, useWalletsStore.getState());
};

const getAccountProfileInfoFromState = (props: { address: string; wallet?: RainbowWallet }, state: WalletsState): AccountProfileInfo => {
  const wallet = props.wallet || state.selected;
  const address = props.address || state.accountAddress;

  if (!wallet || !address) {
    return {
      accountAddress: address,
      accountColor: 0,
    };
  }

  let account = wallet.addresses?.find(account => isLowerCaseMatch(account.address, address));

  if (!account) {
    // find right account
    for (const key in state.wallets) {
      account = state.wallets[key].addresses.find(account => isLowerCaseMatch(account.address, address));
      if (account) break;
    }
  }

  if (!account) {
    return {
      accountAddress: address,
      accountColor: addressHashedColorIndex(ensureValidHex(address)) || 0,
    };
  }

  const { label, color, image } = account;
  const labelWithoutEmoji = label && removeFirstEmojiFromString(label);
  const accountENS = account.ens || '';
  const accountName = labelWithoutEmoji || accountENS || addressAbbreviation(address, 4, 4);
  const accountSymbol = returnStringFirstEmoji(label) || addressHashedEmoji(address) || '🌈';
  const accountColor = color;
  const accountImage = image && isValidImagePath(image) ? image : null;

  return {
    accountAddress: address,
    accountColor,
    accountENS,
    accountImage,
    accountName,
    accountSymbol,
  };
};

// export static functions
export const {
  clearWalletState,
  checkKeychainIntegrity,
  clearAllWalletsBackupStatus,
  createAccount,
  getIsDamagedWallet,
  getIsHardwareWallet,
  getIsReadOnlyWallet,
  getWalletWithAccount,
  loadWallets,
  refreshWalletInfo,
  setAllWalletsWithIdsAsBackedUp,
  setSelectedWallet,
  setWalletBackedUp,
  setWalletReady,
  setAccountAddress,
  updateWallets,
  updateAccount,
} = useWalletsStore.getState();
