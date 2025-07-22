import { saveKeychainIntegrityState } from '@/handlers/localstorage/globalSettings';
import { ensureValidHex, isValidHex } from '@/handlers/web3';
import { removeFirstEmojiFromString, returnStringFirstEmoji } from '@/helpers/emojiHandler';
import { getConsistentArray } from '@/helpers/getConsistentArray';
import WalletTypes from '@/helpers/walletTypes';
import { fetchENSAvatarWithRetry } from '@/hooks/useENSAvatar';
import { ensureError, logger, RainbowError } from '@/logger';
import { parseTimestampFromBackupFile } from '@/model/backup';
import { hasKey } from '@/model/keychain';
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
import { lightModeThemeColors } from '@/styles';
import { useTheme } from '@/theme';
import { isLowerCaseMatch, time } from '@/utils';
import { addressKey, oldSeedPhraseMigratedKey, privateKeyKey, seedPhraseKey } from '@/utils/keychainConstants';
import { addressHashedColorIndex, addressHashedEmoji, fetchReverseRecordWithRetry, isValidImagePath } from '@/utils/profileUtils';
import { shallowEqual } from '@/worklets/comparisons';
import { captureMessage } from '@sentry/react-native';
import { dequal } from 'dequal';
import { toChecksumAddress } from 'ethereumjs-util';
import { keys } from 'lodash';
import { Address } from 'viem';
import { createRainbowStore } from '../internal/createRainbowStore';

interface AccountProfileInfo {
  accountAddress: Address;
  accountColor: number;
  accountENS?: string;
  accountImage?: string | null;
  accountName?: string;
  accountSymbol?: string | false;
}

type WalletNames = { [address: string]: string }; // Maps addresses to ENS names only

interface WalletsState {
  walletReady: boolean;
  setWalletReady: () => void;

  selected: RainbowWallet | null;
  setSelectedWallet: (wallet: RainbowWallet, address?: string) => Promise<void>;

  walletNames: WalletNames;
  wallets: AllRainbowWallets;
  updateWallets: (wallets: { [id: string]: RainbowWallet }) => Promise<void>;

  updateAccountInfo: ({
    address,
    color,
    emoji,
    image,
    label,
    walletId,
  }: { address: Address; walletId: string } & Partial<Pick<RainbowAccount, 'avatar' | 'color' | 'emoji' | 'image' | 'label'>>) => void;

  loadWallets: () => Promise<AllRainbowWallets | void>;

  createAccountInExistingWallet: (data: {
    id: RainbowWallet['id'];
    name: RainbowWallet['name'];
    color: RainbowWallet['color'] | null;
  }) => Promise<void>;

  setAllWalletsWithIdsAsBackedUp: (
    ids: RainbowWallet['id'][],
    method: RainbowWallet['backupType'],
    backupFile?: RainbowWallet['backupFile']
  ) => Promise<void>;

  setWalletBackedUp: (id: RainbowWallet['id'], method: RainbowWallet['backupType'], backupFile?: RainbowWallet['backupFile']) => void;

  clearAllWalletsBackupStatus: () => void;

  accountAddress: Address;
  setAccountAddress: (address: Address) => void;

  getAccountProfileInfo: (address?: Address) => AccountProfileInfo;

  refreshWalletInfo: (props?: { addresses?: string[]; useCachedENS?: boolean }) => Promise<void>;
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
    setSelectedWallet(wallet, address) {
      const { accountAddress: currentAccountAddress, refreshWalletInfo } = get();
      const accountAddress = address ? ensureValidHex(address) : currentAccountAddress;

      set({
        accountAddress,
        selected: wallet,
      });

      void refreshWalletInfo({ addresses: [accountAddress], useCachedENS: true });

      return saveSelectedWalletInKeychain(wallet, accountAddress);
    },

    walletNames: {},

    wallets: {},
    updateWallets: updatedWallets => {
      set({ wallets: updatedWallets });
      return saveAllWallets(updatedWallets);
    },

    updateAccountInfo: ({ address, avatar, color, emoji, image, label, walletId }) => {
      set(state => {
        const { wallets } = state;
        if (!wallets[walletId]) return state;

        const updatedMetadata: Partial<Pick<RainbowAccount, 'avatar' | 'color' | 'image' | 'label'>> = {};

        if (avatar !== undefined) updatedMetadata.avatar = avatar;
        if (color !== undefined) updatedMetadata.color = color;
        if (image !== undefined) updatedMetadata.image = image;

        return {
          ...state,
          wallets: {
            ...wallets,
            [walletId]: {
              ...wallets[walletId],
              addresses: wallets[walletId].addresses.map(account =>
                account.address === address
                  ? {
                      ...account,
                      ...updatedMetadata,
                      emoji: emoji ?? ((label && returnStringFirstEmoji(label)) || account.emoji),
                      label: label ? formatAccountLabel({ address, label, ens: account.ens }) : account.label,
                    }
                  : account
              ),
            },
          },
        };
      });
    },

    walletReady: false,
    setWalletReady: () => {
      if (get().walletReady) return;
      set({ walletReady: true });
    },

    // TODO follow-on and fix this type better - this is matching existing bug from before refactor
    // see PD-188
    accountAddress: INITIAL_ADDRESS,
    setAccountAddress: (accountAddress: Address) => {
      saveAddress(accountAddress);
      set({
        accountAddress,
      });
    },

    getAccountProfileInfo: providedAddress => {
      const state = get();
      const { getWalletWithAccount } = state;
      const address = providedAddress || state.accountAddress;
      const wallet = getWalletWithAccount(address);
      return getAccountProfileInfoFromState({ address, wallet }, state);
    },

    async clearWalletState({ resetKeychain = false } = {}) {
      if (resetKeychain) {
        await cleanUpWalletKeys();
        await Promise.all([saveAddress(INITIAL_ADDRESS), resetSelectedWalletInKeychain(), saveAllWallets({})]);
      }
      set({
        accountAddress: INITIAL_ADDRESS,
        selected: null,
        walletNames: {},
        walletReady: false,
        wallets: {},
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

        set(state => ({
          ...state,
          accountAddress: accountAddress ?? state.accountAddress,
          selected: selectedWallet,
          wallets: applyWalletUpdatesFromKeychain(state.wallets, wallets),
        }));

        const { accountAddress: newAccountAddress, refreshWalletInfo } = get();

        refreshWalletInfo({ addresses: [newAccountAddress] }).then(() => {
          refreshWalletInfo({ useCachedENS: true });
        });

        return wallets;
      } catch (error) {
        logger.error(new RainbowError('[walletsStore]: Exception during walletsLoadState'), {
          message: ensureError(error).message,
        });
      }
    },

    createAccountInExistingWallet: async ({ id, name, color }) => {
      const { wallets } = get();

      if (!wallets[id]) {
        logger.error(new RainbowError(`[walletsStore - createAccountInExistingWallet]: Wallet ${id} not found`));
      }

      let index = 0;
      for (const account of wallets[id].addresses) {
        index = Math.max(index, account.index);
      }

      const newIndex = index + 1;
      const account = await generateAccount(id, newIndex);
      if (!account) {
        throw new Error('[walletsStore - createAccountInExistingWallet]: No account generated');
      }

      const walletColorIndex = color !== null ? color : addressHashedColorIndex(account.address);
      if (walletColorIndex == null) {
        throw new Error(`[walletsStore - createAccountInExistingWallet]: No wallet color index: ${walletColorIndex}`);
      }

      set(state => {
        const newWallets = {
          ...state.wallets,
          [id]: {
            ...state.wallets[id],
            addresses: [
              ...state.wallets[id].addresses,
              {
                address: account.address,
                avatar: null,
                color: walletColorIndex,
                index: newIndex,
                label: name,
                visible: true,
              },
            ],
          },
        };

        return {
          ...state,
          accountAddress: ensureValidHex(account.address),
          selected: newWallets[id],
          wallets: newWallets,
        };
      });

      setPreference(PreferenceActionType.init, 'profile', account.address, {
        accountColor: lightModeThemeColors.avatarBackgrounds[walletColorIndex],
        accountSymbol: addressHashedEmoji(account.address),
      });

      const persist = Promise.all([
        // persist to keychain - not necessary to wait this in many cases
        saveSelectedWalletInKeychain(get().wallets[id], account.address),
        saveAllWallets(get().wallets),
      ]).then(() => {
        return;
      });

      return persist;
    },

    setAllWalletsWithIdsAsBackedUp: async (walletIds, method, backupFile) => {
      const { wallets, selected } = get();

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

      const shouldUpdateSelected = selected?.id && walletIds.includes(selected?.id);

      set(state => ({
        ...state,
        selected: shouldUpdateSelected ? newWallets[selected.id] : state.selected,
        wallets: newWallets,
      }));

      if (shouldUpdateSelected) {
        await Promise.all([saveAllWallets(newWallets), setSelectedWalletInKeychain(newWallets[selected.id])]);
      } else {
        await saveAllWallets(newWallets);
      }
    },

    setWalletBackedUp: (walletId, method, backupFile) =>
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
      }),

    clearAllWalletsBackupStatus: () =>
      set(state => {
        const { wallets } = state;

        const newWallets = Object.fromEntries(
          Object.entries(wallets).map(([key, wallet]) => [
            key,
            {
              ...wallet,
              backedUp: undefined,
              backupDate: undefined,
              backupFile: undefined,
              backupType: undefined,
            },
          ])
        );

        return { ...state, wallets: newWallets };
      }),

    async refreshWalletInfo({ addresses, useCachedENS } = {}) {
      const { wallets } = get();

      // Default to a full refresh if no addresses provided
      const targetAddresses = addresses || Object.values(wallets).flatMap(w => w.addresses.map(account => account.address));
      if (!targetAddresses.length) return;

      try {
        const accountsToRefresh: Array<{ walletId: string; account: RainbowAccount }> = [];

        Object.entries(wallets).forEach(([walletId, wallet]) => {
          wallet.addresses.forEach(account => {
            if (targetAddresses.includes(account.address)) {
              accountsToRefresh.push({ walletId, account });
            }
          });
        });

        const results = await Promise.all(
          accountsToRefresh.map(async ({ walletId, account }) => ({
            walletId,
            address: account.address,
            metadata: await refreshAccountInfo(account, useCachedENS),
          }))
        );

        set(state => {
          if (!state.wallets) return state;

          const newWallets = { ...state.wallets };
          const newWalletNames = { ...state.walletNames };

          results.forEach(({ walletId, address, metadata }) => {
            const currentWallet = newWallets[walletId];
            if (!currentWallet || !metadata) return;

            newWallets[walletId] = {
              ...currentWallet,
              addresses: currentWallet.addresses.map(account => {
                if (account.address !== address) return account;
                return {
                  ...account,
                  emoji: account.emoji || addressHashedEmoji(address) || undefined,
                  ens: metadata.ens || account.ens,
                  image: metadata.image || account.image,
                  label: metadata.label || account.label,
                };
              }),
            };

            if (metadata.ens) {
              // Update ENS names mapping
              newWalletNames[address] = metadata.ens;
            } else if (newWalletNames[address]) {
              // Remove if ENS was cleared
              delete newWalletNames[address];
            }
          });

          const newSelected = state.selected && newWallets[state.selected.id] ? newWallets[state.selected.id] : state.selected;

          return {
            ...state,
            selected: newSelected,
            wallets: newWallets,
            walletNames: newWalletNames,
          };
        });
      } catch (error) {
        logger.error(new RainbowError('[walletsStore]: Failed to refresh metadata'), {
          addresses: targetAddresses,
          error: ensureError(error).message,
        });
      }
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

        if (!selected) {
          logger.warn('[walletsStore]: selectedWallet is missing');
        }

        const nonReadOnlyWalletKeys = keys(wallets).filter(key => wallets[key].type !== WalletTypes.readOnly);
        const damagedWalletIds = new Set<string>();

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
            damagedWalletIds.add(wallet.id);
          }
        }

        if (damagedWalletIds.size) {
          set(state => {
            if (!state.wallets) return state;

            const updatedWallets = { ...state.wallets };

            damagedWalletIds.forEach(walletId => {
              updatedWallets[walletId] = {
                ...updatedWallets[walletId],
                damaged: true,
              };
            });

            const newSelected =
              state.selected && damagedWalletIds.has(state.selected.id) ? updatedWallets[state.selected.id] : state.selected;

            logger.debug('[walletsStore]: done updating wallets');

            return {
              ...state,
              wallets: updatedWallets,
              selected: newSelected,
            };
          });
        }

        if (!healthyKeychain) {
          captureMessage('Keychain Integrity is not OK');
        }

        logger.debug('[walletsStore]: check completed');
        saveKeychainIntegrityState('done');
      } catch (e) {
        logger.error(new RainbowError("[walletsStore]: error thrown'"), {
          message: ensureError(e).message,
        });
        captureMessage('Error running keychain integrity checks');
      }
    },

    getWalletWithAccount(accountAddress: string): RainbowWallet | undefined {
      const { wallets } = get();
      const lowerCaseAccountAddress = accountAddress.toLowerCase();
      for (const key of Object.keys(wallets)) {
        const wallet = wallets[key];
        const found = wallet.addresses?.find(account => isLowerCaseMatch(account.address, lowerCaseAccountAddress));
        if (found) {
          return wallet;
        }
      }
    },
  }),
  {
    storageKey: 'walletStore',
    partialize: state => ({
      selected: state.selected,
      accountAddress: state.accountAddress,
      wallets: state.wallets,
      walletNames: state.walletNames,
    }),
    persistThrottleMs: time.seconds(1),
  }
);

async function refreshAccountInfo(
  account: RainbowAccount,
  useCachedENS = false
): Promise<Partial<Pick<RainbowAccount, 'ens' | 'image' | 'label'>> | null> {
  try {
    if (useCachedENS && account.ens !== undefined) {
      // If we've already checked for ENS, don't check again
      return null;
    }

    const ens = await fetchReverseRecordWithRetry(account.address);

    if (ens) {
      // Only fetch avatar if ENS changed or we don't have an image
      const shouldFetchAvatar = account.ens !== ens || !account.image;
      let newImage = account.image;

      if (shouldFetchAvatar) {
        const avatar = await fetchENSAvatarWithRetry(ens);
        newImage = avatar?.imageUrl || null;
      }

      return {
        ens,
        image: newImage,
        label: formatAccountLabel({ address: account.address, label: account.label, ens }),
      };
    }

    // Mark as checked but not found
    return { ens: null };
  } catch (error) {
    logger.debug('[refreshAccountInfo]: Failed to fetch ENS data', {
      address: account.address,
      error: ensureError(error).message,
    });
    return null;
  }
}

export const useWallets = () => useWalletsStore(state => state.wallets);
export const useWallet = (id: string) => useWalletsStore(state => state.wallets?.[id]);

export const getAccountAddress = () => useWalletsStore.getState().accountAddress;
export const getWallets = () => useWalletsStore.getState().wallets;
export const getSelectedWallet = () => useWalletsStore.getState().selected;
export const getWalletReady = () => useWalletsStore.getState().walletReady;

export const getWalletAddresses = (wallets: AllRainbowWallets | null) => {
  return getConsistentArray(
    Object.values(wallets || {}).flatMap(wallet => (wallet.addresses || []).map(account => account.address as Address))
  );
};

export const useAccountAddress = () => useWalletsStore(state => state.accountAddress);
export const useSelectedWallet = () => useWalletsStore(state => state.selected);
export const useIsReadOnlyWallet = () => useWalletsStore(state => state.getIsReadOnlyWallet());
export const useIsHardwareWallet = () => useWalletsStore(state => state.getIsHardwareWallet());
export const useIsDamagedWallet = () => useWalletsStore(state => state.getIsDamagedWallet());

export const useWalletAddresses = () => useWalletsStore(state => getWalletAddresses(state.wallets), shallowEqual);

export const isImportedWallet = (address: string): boolean => {
  const wallets = getWallets();
  if (!Object.keys(wallets).length) {
    return false;
  }

  for (const wallet of Object.values(wallets)) {
    if ((wallet.addresses || []).some(account => account.address === address)) {
      return true;
    }
  }
  return false;
};

export const useAccountProfileInfo = (address?: Address) => {
  const { colors } = useTheme();
  return useWalletsStore(state => {
    const info = state.getAccountProfileInfo(address);
    return {
      ...info,
      accountColorHex: info?.accountColor ? colors.avatarBackgrounds[info.accountColor] : '',
    };
  }, dequal);
};

const getAccountProfileInfoFromState = (props: { address: Address; wallet?: RainbowWallet }, state: WalletsState): AccountProfileInfo => {
  const wallet = props.wallet || state.selected;
  const { walletNames } = state;
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

  const accountENS = ens || walletNames?.[address] || undefined;
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

function applyWalletUpdatesFromKeychain(storeWallets: AllRainbowWallets, keychainWallets: AllRainbowWallets): AllRainbowWallets {
  if (!Object.keys(storeWallets).length) return keychainWallets;

  let newWallets = storeWallets;

  Object.entries(keychainWallets).forEach(([walletId, keychainWallet]) => {
    if (!newWallets[walletId]) {
      // Wallet doesn't exist in store - add it
      newWallets = { ...newWallets, [walletId]: keychainWallet };
    } else {
      // Wallet exists - check for missing addresses or wallet type changes
      const existingAddresses = new Set(newWallets[walletId].addresses.map(a => a.address.toLowerCase()));
      const missingAddresses = keychainWallet.addresses.filter(account => !existingAddresses.has(account.address.toLowerCase()));

      const needsUpdate = missingAddresses.length || newWallets[walletId].type !== keychainWallet.type;

      if (needsUpdate) {
        // Add new addresses to existing wallet
        newWallets = {
          ...newWallets,
          [walletId]: {
            ...newWallets[walletId],
            addresses: missingAddresses.length ? [...newWallets[walletId].addresses, ...missingAddresses] : newWallets[walletId].addresses,
            type: keychainWallet.type,
          },
        };
      }
    }
  });

  return newWallets;
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

async function saveSelectedWalletInKeychain(wallet: RainbowWallet, accountAddress?: string) {
  await Promise.all([accountAddress ? saveAddress(accountAddress) : null, setSelectedWalletInKeychain(wallet)]);
}

// export static functions
export const {
  clearWalletState,
  checkKeychainIntegrity,
  clearAllWalletsBackupStatus,
  createAccountInExistingWallet,
  getAccountProfileInfo,
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
  updateAccountInfo,
  updateWallets,
} = useWalletsStore.getState();
