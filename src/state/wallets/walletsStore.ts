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

interface WalletsState {
  walletReady: boolean;
  setWalletReady: () => void;

  selected: RainbowWallet | null;
  setSelectedWallet: (wallet: RainbowWallet, address?: string) => Promise<void>;

  wallets: AllRainbowWallets;
  updateWallets: (wallets: AllRainbowWallets) => Promise<void>;

  update: (props: { wallets?: AllRainbowWallets; selected?: RainbowWallet; accountAddress?: Address }) => Promise<void>;

  updateAccount: (walletId: string, account: Partial<RainbowAccount> & Pick<RainbowAccount, 'address'>) => RainbowWallet | null;

  loadWallets: () => Promise<AllRainbowWallets | void>;

  createAccount: (data: { id: RainbowWallet['id']; name: RainbowWallet['name']; color: RainbowWallet['color'] | null }) => Promise<{
    [id: string]: RainbowWallet;
  }>;

  setAllWalletsWithIdsAsBackedUp: (
    ids: RainbowWallet['id'][],
    method: RainbowWallet['backupType'],
    backupFile?: RainbowWallet['backupFile']
  ) => void;

  setWalletBackedUp: (id: RainbowWallet['id'], method: RainbowWallet['backupType'], backupFile?: RainbowWallet['backupFile']) => void;

  clearAllWalletsBackupStatus: () => void;

  accountAddress: Address;
  setAccountAddress: (address: Address) => void;

  getAccountProfileInfo: () => AccountProfileInfo;

  refreshWalletInfo: (props?: { cachedENS?: boolean; addresses?: string[] }) => Promise<void>;

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
      set({
        accountAddress: address ? ensureValidHex(address) : get().accountAddress,
        selected: {
          ...wallet,
        },
      });

      await Promise.all([
        get().refreshWalletInfo({
          addresses: address ? [address] : undefined,
        }),
        (() => {
          if (address) {
            const accountAddress = ensureValidHex(address);
            return saveAddress(accountAddress);
          }
        })(),
        setSelectedWalletInKeychain(wallet),
      ]);
    },

    wallets: {},

    updateWallets: async walletsIn => {
      const wallets = await getRefreshedWallets({
        wallets: walletsIn,
        cachedENS: true,
      });
      await saveAllWallets(wallets);
      return get().update({ wallets });
    },

    updateAccount(walletId, account) {
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

      if (!account.label) {
        const { defaultLabel } = getDefaultLabel(account.address);
        account.label = defaultLabel;
      }

      const updatedWallet = {
        ...wallet,
        addresses: accounts.map((account, index) => {
          return index === accountIndex ? updatedAccount : account;
        }),
      };

      const updatedWallets = {
        ...wallets,
        [walletId]: updatedWallet,
      } satisfies AllRainbowWallets;

      // avoid await - this is label/color/etc, not critical and not likely to race
      void get().update({ wallets: updatedWallets });

      return updatedWallet;
    },

    refreshWalletInfo: async props => {
      const { wallets } = get();
      const refreshedWallets = await getRefreshedWallets({
        ...props,
        wallets,
      });
      await get().update({ wallets: refreshedWallets });
    },

    update({ wallets: walletsIn, accountAddress, selected }) {
      // wallets may have changed since the refresh started so lets merge them together
      set(state => {
        // prefer the latest state
        const latestWallets = { ...state.wallets };

        // loop the refreshed wallet info
        for (const key in walletsIn) {
          const latestWallet = latestWallets[key];
          const updatedWallet = walletsIn[key];

          // if deleted or added to latest state, no need to update
          if (!latestWallet || !updatedWallet) {
            continue;
          }

          // update wallet with refreshed info
          latestWallets[key] = {
            ...latestWallet,
            addresses: latestWallet.addresses.map(latestAccount => {
              const refreshedAccount = updatedWallet.addresses.find(account => account.address === latestAccount.address);

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
          accountAddress: accountAddress || state.accountAddress,
          selected: selected || state.selected,
        };
      });

      return saveAllWallets(get().wallets);
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
        selected: null,
      });
    },

    // this runs every time we create a wallet and ensures we normalize
    // and refresh wallet info before setting we write to keychain
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

        await updateWallets(wallets);
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

      const newWallets = {
        ...wallets,
        [id]: newWallet,
      };

      await get().update({
        accountAddress: ensureValidHex(account.address),
        selected: newWallet,
        wallets: newWallets,
      });

      return newWallets;
    },

    setAllWalletsWithIdsAsBackedUp: (walletIds, method, backupFile) => {
      const { wallets } = get();

      const newWallets = { ...wallets };

      let backupDate = Date.now();
      if (backupFile) {
        backupDate = parseTimestampFromBackupFile(backupFile) ?? Date.now();
      }

      walletIds.forEach(walletId => {
        newWallets[walletId] = {
          ...newWallets[walletId],
          backedUp: true,
          backupDate,
          backupFile,
          backupType: method,
        };
      });

      logger.log(`setting wallets as backed up`, {
        walletIds,
      });
      get().update(newWallets);
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
        logger.debug('[walletsStore]: Starting keychain integrity checks');

        const hasAddress = await hasKey(addressKey);
        if (!hasAddress) {
          logger.debug(`[walletsStore]: address is missing: ${hasAddress}`);
        }

        const hasOldSeedPhraseMigratedFlag = await hasKey(oldSeedPhraseMigratedKey);
        if (!hasOldSeedPhraseMigratedFlag) {
          logger.debug(`[walletsStore]: migrated flag is present: ${hasOldSeedPhraseMigratedFlag}`);
        }

        const hasOldSeedphrase = await hasKey(seedPhraseKey);
        if (!hasOldSeedphrase) {
          logger.debug(`[walletsStore]: old seed is present: ${hasOldSeedphrase}`);
        }

        const { wallets, selected } = get();
        if (!selected) {
          logger.warn('[walletsStore]: selectedWallet is missing');
        }

        const walletsMarkedDamaged: AllRainbowWallets = Object.fromEntries(
          await Promise.all(
            Object.entries(wallets).map(async ([key, wallet]) => {
              if (wallets[key].type === WalletTypes.readOnly) {
                return [key, wallet];
              }

              // A wallet is NOT damaged if:
              // - it's not imported
              // - and hasn't been migrated yet
              // - and the old seedphrase is still there
              if (!wallet.imported && !hasOldSeedPhraseMigratedFlag && hasOldSeedphrase) {
                return [key, wallet];
              }

              const walletMarkedDamaged = [key, { ...wallet, damaged: true }];

              const seedKeyFound = await hasKey(`${key}_${seedPhraseKey}`);
              if (!seedKeyFound) {
                return walletMarkedDamaged;
              }

              const hasDamagedAccounts = await Promise.all(
                wallet.addresses.map(async account => {
                  const pkeyFound = await hasKey(`${account.address}_${privateKeyKey}`);
                  return !pkeyFound;
                })
              );

              if (hasDamagedAccounts.some(Boolean)) {
                return walletMarkedDamaged;
              }

              return [key, wallet];
            })
          )
        );

        const newWallets = Object.values(walletsMarkedDamaged);
        const hasDamagedWallet = newWallets.some(w => w.damaged);

        if (hasDamagedWallet || !hasAddress) {
          captureMessage(`Keychain Integrity is not OK: hasAddress: ${hasAddress} hasDamagedWallet ${hasDamagedWallet}`);

          const lastSelected = newWallets.find(w => w.id === get().selected?.id);
          const newSelected = lastSelected?.damaged ? newWallets.find(w => !w.damaged) : lastSelected;

          get().update({ wallets: walletsMarkedDamaged, selected: newSelected });
        }

        saveKeychainIntegrityState('done');
      } catch (e) {
        logger.error(new RainbowError("[walletsStore]: error thrown'", e));
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
    storageKey: 'walletsStore2',
    persistThrottleMs: time.seconds(1),
    partialize: state => ({
      selected: state.selected,
      accountAddress: state.accountAddress,
      wallets: state.wallets,
    }),
  }
);

type GetENSInfoProps = {
  addresses?: string[];
  wallets: AllRainbowWallets | null;
  cachedENS?: boolean;
};

async function getRefreshedWallets({ addresses, wallets, cachedENS }: GetENSInfoProps) {
  if (!wallets) {
    throw new Error(`No wallets`);
  }

  const updatedWallets: Record<string, RainbowWallet> = {};

  await Promise.all(
    Object.entries(wallets).map(async ([key, wallet]) => {
      const newAddresses = await Promise.all(
        wallet.addresses.map(async ogAccount => {
          if (addresses && !addresses.includes(ogAccount.address)) {
            // skip update if we are filtering down to specific addresses
            return ogAccount;
          }
          const account = await refreshAccountInfo(ogAccount, cachedENS);
          return account;
        })
      );

      updatedWallets[key] = {
        ...wallet,
        addresses: newAddresses,
      };
    })
  );

  return updatedWallets;
}

export function getDefaultLabel(address: string) {
  const isHex = isValidHex(address);
  const abbreviatedAddress = isHex ? addressAbbreviation(address, 4, 4) : address;
  const defaultEmoji = addressHashedEmoji(address);
  return {
    defaultLabel: defaultEmoji ? `${defaultEmoji} ${abbreviatedAddress}` : address,
    defaultEmoji,
    abbreviatedAddress,
  };
}

// this isn't really our primary way of updating account info, and when people pull to refresh
// they get new info, so for ENS related stuff we can just check if not valid hex + has image

async function refreshAccountInfo(account: RainbowAccount, cachedENS = false): Promise<RainbowAccount> {
  const { abbreviatedAddress, defaultLabel } = getDefaultLabel(account.address);

  const hasDefaultLabel = account.label === defaultLabel || account.label === abbreviatedAddress || account.label === account.address;
  const hasEnoughData = typeof account.ens === 'string';
  const shouldCacheAccount = Boolean(cachedENS && hasEnoughData);

  if (shouldCacheAccount) {
    if (!account.label) {
      return {
        ...account,
        label: defaultLabel,
      };
    }

    return account;
  }

  const ens = await fetchReverseRecordWithRetry(account.address);

  if (ens) {
    const avatar = await fetchENSAvatarWithRetry(ens);
    const newImage = avatar?.imageUrl || null;

    const shouldSetLabelToENS =
      !account.label ||
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
