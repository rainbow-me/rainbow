import { saveKeychainIntegrityState } from '@/handlers/localstorage/globalSettings';
import { ensureValidHex, isValidHex } from '@/handlers/web3';
import { removeFirstEmojiFromString, returnStringFirstEmoji } from '@/helpers/emojiHandler';
import { objectMapValues } from '@/helpers/objectTypes';
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
  setSelectedWallet: (wallet: RainbowWallet, address?: string) => void;

  wallets: AllRainbowWallets;
  updateWallets: (props: { wallets?: AllRainbowWallets; selected?: RainbowWallet; accountAddress?: Address }) => Promise<void>;
  mapUpdateWallets: (getNewWallet: (wallet: RainbowWallet) => RainbowWallet) => Promise<void>;

  updateAccountInfo: (
    props: { address: Address; walletId: string } & Partial<Pick<RainbowAccount, 'avatar' | 'color' | 'emoji' | 'image' | 'label'>>
  ) => void;

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

  getAccountProfileInfo: (address?: Address) => AccountProfileInfo;

  refreshWalletInfo: (props?: { cachedENS?: boolean; addresses?: string[] }) => Promise<void>;

  checkKeychainIntegrity: () => Promise<void>;

  getIsDamagedWallet: () => boolean;
  getIsReadOnlyWallet: () => boolean;
  getIsHardwareWallet: () => boolean;
  getWalletForAddress: (address: string) => RainbowWallet | undefined;
  getAccountForAddress: (address: string) => RainbowAccount | undefined;

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

    /**
     * We generally want to route wallet updates through here as it will save to keychain
     */
    updateWallets({ wallets, accountAddress, selected }) {
      set(state => ({
        ...state,
        wallets: wallets ? mergeWallets(state.wallets, wallets) : state.wallets,
        accountAddress: accountAddress || state.accountAddress,
        selected: selected || state.selected,
      }));

      return saveAllWallets(get().wallets);
    },

    // helper to make it easier to be immutable
    async mapUpdateWallets(getter) {
      await updateWallets({
        wallets: objectMapValues(get().wallets, getter),
      });
    },

    updateAccountInfo({ address, avatar, color, emoji, image, label, walletId }) {
      // avoid await - this is label/color/etc, not critical for keychain
      void get().mapUpdateWallets(wallet => {
        if (wallet.id !== walletId) {
          return wallet;
        }

        const updatedMetadata: Partial<Pick<RainbowAccount, 'avatar' | 'color' | 'image' | 'label'>> = {};

        if (avatar !== undefined) updatedMetadata.avatar = avatar;
        if (color !== undefined) updatedMetadata.color = color;
        if (image !== undefined) updatedMetadata.image = image;

        return {
          ...wallet,
          addresses: wallet.addresses.map(account =>
            account.address === address
              ? {
                  ...account,
                  ...updatedMetadata,
                  emoji: emoji ?? ((label && returnStringFirstEmoji(label)) || account.emoji),
                  label: formatAccountLabel({ address, label, ens: account.ens }),
                }
              : account
          ),
        };
      });
    },

    refreshWalletInfo: async props => {
      const { wallets } = get();
      const refreshedWallets = await getRefreshedWallets({
        ...props,
        wallets,
      });
      await get().updateWallets({ wallets: refreshedWallets });
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

    getAccountProfileInfo: providedAddress => {
      const state = get();
      const address = providedAddress || state.accountAddress;
      const wallet = state.getWalletForAddress(address);
      return getAccountProfileInfoFromState({ address, wallet }, state);
    },

    async clearWalletState({ resetKeychain = false } = {}) {
      if (resetKeychain) {
        await wipeKeychain();
        await cleanUpWalletKeys();
        await Promise.all([saveAddress(INITIAL_ADDRESS), resetSelectedWalletInKeychain(), saveAllWallets({})]);
      }
      set({
        accountAddress: INITIAL_ADDRESS,
        wallets: {},
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

        // loadWallets is used with backup flow to set => get => set
        // that needs refactoring be we want to await for keychain write here
        await get().updateWallets({
          accountAddress: accountAddress ? ensureValidHex(accountAddress) : undefined,
          selected: selectedWallet,
          wallets,
        });

        const { accountAddress: newAccountAddress, refreshWalletInfo } = get();

        void refreshWalletInfo({ addresses: [newAccountAddress] }).then(() => {
          refreshWalletInfo({ cachedENS: true });
        });

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

      // create flows are very slow, and keychain is safely merged
      void get().updateWallets({
        accountAddress: ensureValidHex(account.address),
        selected: newWallet,
        wallets: newWallets,
      });

      void store.dispatch(updateWebDataEnabled(true, account.address));
      void setPreference(PreferenceActionType.init, 'profile', account.address, {
        accountColor: lightModeThemeColors.avatarBackgrounds[walletColorIndex],
        accountSymbol: addressHashedEmoji(account.address),
      });

      return newWallets;
    },

    setAllWalletsWithIdsAsBackedUp: (walletIds, method, backupFile) => {
      logger.log(`setting wallets as backed up`, {
        walletIds,
      });

      let backupDate = Date.now();
      if (backupFile) {
        backupDate = parseTimestampFromBackupFile(backupFile) ?? Date.now();
      }

      return get().mapUpdateWallets(wallet =>
        walletIds.includes(wallet.id)
          ? {
              ...wallet,
              backedUp: true,
              backupDate,
              backupFile,
              backupType: method,
            }
          : wallet
      );
    },

    setWalletBackedUp: (walletId, method, backupFile) => {
      set(state => {
        const { selected, wallets } = state;

        let backupDate = Date.now();
        if (backupFile) {
          backupDate = parseTimestampFromBackupFile(backupFile) ?? Date.now();
        }

        const newWallets = {
          ...wallets,
          [walletId]: {
            ...wallets[walletId],
            backedUp: true,
            backupDate,
            backupFile,
            backupType: method,
          },
        };

        return {
          ...state,
          selected: selected?.id === walletId ? newWallets[walletId] : state.selected,
          wallets: newWallets,
        };
      });
    },

    clearAllWalletsBackupStatus: () => {
      return get().mapUpdateWallets(wallet => ({
        ...wallet,
        backedUp: undefined,
        backupDate: undefined,
        backupFile: undefined,
        backupType: undefined,
      }));
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

          get().updateWallets({ wallets: walletsMarkedDamaged, selected: newSelected });
        }

        saveKeychainIntegrityState('done');
      } catch (e) {
        logger.error(new RainbowError("[walletsStore]: error thrown'", e));
        captureMessage('Error running keychain integrity checks');
      }
    },

    getWalletForAddress(address: string): RainbowWallet | undefined {
      const { wallets } = get();
      if (!wallets) return;
      for (const wallet of Object.values(wallets)) {
        const found = wallet.addresses?.find(account => isLowerCaseMatch(account.address, address));
        if (found) {
          return wallet;
        }
      }
    },

    getAccountForAddress(address: string): RainbowAccount | undefined {
      const { wallets } = get();
      if (!wallets) return;
      for (const wallet of Object.values(wallets)) {
        const found = wallet.addresses?.find(account => isLowerCaseMatch(account.address, address));
        if (found) {
          return found;
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

function mergeWallets(oldWallets: AllRainbowWallets, newWallets: AllRainbowWallets) {
  // prefer the latest state
  const next = { ...oldWallets };

  // loop the refreshed wallet info
  for (const key in newWallets) {
    const oldWallet = next[key];
    const newWallet = newWallets[key];

    // if deleted or added to latest state, no need to update
    if (!oldWallet || !newWallet) {
      continue;
    }

    // update wallet with refreshed info
    next[key] = {
      ...oldWallet,
      addresses: oldWallet.addresses.map(oldAccount => {
        const newAccount = newWallet.addresses.find(account => account.address === oldAccount.address);

        // account has been removed, keep new state
        if (!newAccount) {
          return oldAccount;
        }

        return {
          ...oldAccount,
          ...newAccount,
        };
      }),
    };
  }

  return next;
}

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
      const updatedAccounts = await Promise.all(
        wallet.addresses.map(async ogAccount => {
          if (addresses && !addresses.includes(ogAccount.address)) {
            // skip update if we are filtering down to specific addresses
            return ogAccount;
          }
          const refreshed = await refreshAccountInfo(ogAccount, cachedENS);
          return refreshed ? { ...ogAccount, ...refreshed } : ogAccount;
        })
      );

      updatedWallets[key] = {
        ...wallet,
        addresses: updatedAccounts,
      };
    })
  );

  return updatedWallets;
}

async function refreshAccountInfo(
  account: RainbowAccount,
  cachedENS = false
): Promise<Partial<Pick<RainbowAccount, 'ens' | 'image' | 'label'>> | null> {
  const hasEnoughData = account.ens !== undefined;
  const shouldCacheAccount = Boolean(cachedENS && hasEnoughData);
  const defaultLabel = account.ens || account.address;

  if (shouldCacheAccount) {
    if (!account.label) {
      return {
        label: defaultLabel,
      };
    }

    return null;
  }

  const ens = await fetchReverseRecordWithRetry(account.address);

  if (ens) {
    const avatar = await fetchENSAvatarWithRetry(ens);
    const newImage = avatar?.imageUrl || null;
    const hasDefaultLabel = account.label === account.ens || account.label === account.address;

    const shouldSetLabelToENS =
      !account.label ||
      (account.ens && account.ens !== ens) ||
      // prefer users label if they set to something other than account
      hasDefaultLabel;

    return {
      image: newImage,
      ens,
      label: shouldSetLabelToENS ? ens : account.label,
    };
  }

  // mark checked but not found
  return {
    ens: null,
  };
}

export function formatAccountLabel({
  address,
  ens,
  label,
}: {
  address: Address | string;
  ens: string | null | undefined;
  label: string | null | undefined;
}): string {
  const firstEmoji = label ? returnStringFirstEmoji(label) : null;
  const labelWithoutEmoji = firstEmoji && label ? removeFirstEmojiFromString(label) : label;
  const formattedLabel = labelWithoutEmoji === address ? undefined : labelWithoutEmoji;

  return formattedLabel || ens || '';
}

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

const getAccountProfileInfoFromState = (props: { address: Address; wallet?: RainbowWallet }, state: WalletsState): AccountProfileInfo => {
  const wallet = props.wallet || state.selected;
  const address = props.address || state.accountAddress;

  if (!wallet) {
    return {
      accountAddress: address,
      accountColor: addressHashedColorIndex(address) ?? 0,
      accountSymbol: addressHashedEmoji(address) ?? undefined,
    };
  }

  const selectedAccount = wallet.addresses?.find(account => isLowerCaseMatch(account.address, address));

  if (!selectedAccount) {
    return {
      accountAddress: address,
      accountColor: addressHashedColorIndex(address) ?? 0,
      accountSymbol: addressHashedEmoji(address) ?? undefined,
    };
  }

  const { label, color, emoji, ens, image } = selectedAccount;

  const firstEmoji = label ? returnStringFirstEmoji(label) : null;
  const labelWithoutEmoji = firstEmoji && label ? removeFirstEmojiFromString(label) : label;

  const accountENS = ens || undefined;
  const accountName = labelWithoutEmoji || accountENS || '';
  const accountSymbol = emoji || addressHashedEmoji(address) || undefined;
  const accountImage = image && isValidImagePath(image) ? image : null;

  return {
    accountAddress: address,
    accountColor: color,
    accountENS,
    accountImage,
    accountName,
    accountSymbol,
  };
};

// export static functions
export const {
  checkKeychainIntegrity,
  clearAllWalletsBackupStatus,
  clearWalletState,
  createAccount,
  getAccountForAddress,
  getAccountProfileInfo,
  getIsDamagedWallet,
  getIsHardwareWallet,
  getIsReadOnlyWallet,
  getWalletForAddress,
  loadWallets,
  refreshWalletInfo,
  setAccountAddress,
  setAllWalletsWithIdsAsBackedUp,
  setSelectedWallet,
  setWalletBackedUp,
  setWalletReady,
  updateAccountInfo,
  updateWallets,
  mapUpdateWallets,
} = useWalletsStore.getState();
