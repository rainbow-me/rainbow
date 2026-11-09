import { captureMessage } from '@sentry/react-native';
import { createBaseStore, createDerivedStore } from '@storesjs/stores';
import { dequal } from 'dequal';
import { getAddress, type Address } from 'viem';

import { normalizeAddress } from '@/features/address/core/address';
import { parseTimestampFromBackupFile } from '@/features/backup/backupFile';
import { useEnsImageStore } from '@/features/ens/data/stores/imageStore';
import { useEnsNameStore } from '@/features/ens/data/useEnsNameStore';
import * as kc from '@/features/local-auth/keychain';
import { didShowWalletErrorSheetKey } from '@/features/local-auth/keychainConstants';
import {
  checkWalletsDamagedState,
  cleanUpWalletKeys,
  getAllWallets,
  getSelectedWallet as getSelectedWalletFromKeychain,
  loadAddress,
  resetSelectedWallet as resetSelectedWalletInKeychain,
  saveAddress,
  saveAllWallets,
  setSelectedWallet as setSelectedWalletInKeychain,
} from '@/features/wallet/data/walletKeychain';
import { type AllRainbowWallets, type RainbowAccount, type RainbowWallet } from '@/features/wallet/types';
import { watchingAlert } from '@/features/wallet/utils/watchingAlert';
import { time } from '@/framework/core/utils/time';
import { removeWalletData } from '@/handlers/localstorage/removeWallet';
import { ensureValidHex, isValidHex } from '@/handlers/web3';
import { removeFirstEmojiFromString, returnStringFirstEmoji } from '@/helpers/emojiHandler';
import { getConsistentArray } from '@/helpers/getConsistentArray';
import WalletTypes from '@/helpers/walletTypes';
import { ensureError, logger, RainbowError } from '@/logger';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { darkModeThemeColors, lightModeThemeColors } from '@/styles/colors';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStore } from '@/theme/themeStore';
import isLowerCaseMatch from '@/utils/isLowerCaseMatch';
import { addressHashedColorIndex, addressHashedEmoji, isValidImagePath } from '@/utils/profileUtils';
import { shallowEqual } from '@/worklets/comparisons';

interface AccountProfileInfo {
  accountAddress: Address;
  accountColor: number;
  accountENS?: string;
  accountImage?: string | null;
  accountName?: string;
  accountSymbol?: string | false;
}

type WalletNames = { [address: string]: string }; // Maps addresses to ENS names only

/** Wallet inventory and the selected account, with mutations owned by this store. */
export interface WalletsState {
  selectedWalletId: RainbowWallet['id'] | null;
  /** Returns the selected wallet's current contents, or null while unavailable. */
  getSelectedWallet: () => RainbowWallet | null;
  /** Selects an account in an existing wallet without replacing its contents. */
  setSelectedWallet: (walletId: RainbowWallet['id'], accountAddress: Address) => Promise<void>;
  /** Removes an account and selects a remaining account when the selected account was removed. */
  removeAccount: (walletId: RainbowWallet['id'], accountAddress: Address) => Promise<void>;

  walletNames: WalletNames;
  wallets: AllRainbowWallets;
  updateWallets: (wallets: AllRainbowWallets) => Promise<void>;

  /**
   * Admits a created or repaired wallet, preserving its existing account and backup metadata.
   * Supplying an account selects it; omitted selection preserves the current visible account.
   * Replaced IDs are groups absorbed by account discovery.
   */
  addWallet: (wallet: RainbowWallet, accountAddress?: Address, replacedWalletIds?: readonly RainbowWallet['id'][]) => Promise<void>;

  /** Adds an account to a wallet, makes the account active, and returns the updated wallet. */
  addAccountToWallet: (walletId: RainbowWallet['id'], account: RainbowAccount) => RainbowWallet;

  updateAccountInfo: ({
    address,
    color,
    emoji,
    image,
    label,
    walletId,
  }: { address: Address; walletId: string } & Partial<Pick<RainbowAccount, 'avatar' | 'color' | 'emoji' | 'image' | 'label'>>) => void;

  loadWallets: () => Promise<AllRainbowWallets | void>;

  setAllWalletsWithIdsAsBackedUp: (
    ids: RainbowWallet['id'][],
    method: RainbowWallet['backupType'],
    backupFile?: RainbowWallet['backupFile']
  ) => Promise<void>;

  setWalletBackedUp: (id: RainbowWallet['id'], method: RainbowWallet['backupType'], backupFile?: RainbowWallet['backupFile']) => void;

  clearAllWalletsBackupStatus: () => void;

  accountAddress: Address;

  getAccountProfileInfo: (address?: Address) => AccountProfileInfo;

  refreshWalletInfo: (props?: { addresses?: string[]; useCachedENS?: boolean }) => Promise<void>;
  checkKeychainIntegrity: () => Promise<void>;
  setWalletDamaged: (walletId: string, damaged: boolean) => void;

  getIsDamagedWallet: (walletId?: string) => boolean;
  getIsReadOnlyWallet: () => boolean;
  getIsHardwareWallet: () => boolean;
  getWalletWithAccount: (accountAddress: string) => RainbowWallet | undefined;

  clearWalletState: (options?: { resetKeychain?: boolean }) => Promise<void>;
}

const INITIAL_ADDRESS = '' as Address;

const INITIAL_WALLET_STATE = {
  accountAddress: INITIAL_ADDRESS,
  selectedWalletId: null,
  walletNames: {},
  wallets: {},
};

type PersistedWalletsState = Partial<Pick<WalletsState, 'accountAddress' | 'selectedWalletId' | 'wallets' | 'walletNames'>> & {
  selected?: RainbowWallet | null;
};

export const useWalletsStore = createBaseStore<WalletsState, PersistedWalletsState>(
  (set, get) => ({
    getIsDamagedWallet: (walletId?: string) => {
      const state = get();
      const wallet = walletId === undefined ? state.getSelectedWallet() : state.wallets[walletId];
      return !!wallet?.damaged;
    },
    getIsReadOnlyWallet: () => get().getSelectedWallet()?.type === WalletTypes.readOnly,
    getIsHardwareWallet: () => get().getSelectedWallet()?.type === WalletTypes.bluetooth,

    ...INITIAL_WALLET_STATE,

    getSelectedWallet: () => {
      const { selectedWalletId, wallets } = get();
      return selectedWalletId === null ? null : (wallets[selectedWalletId] ?? null);
    },

    setSelectedWallet(walletId, accountAddress) {
      set(state => {
        if (state.selectedWalletId === walletId && state.accountAddress === accountAddress) return state;
        return { selectedWalletId: walletId, accountAddress };
      });

      const { refreshWalletInfo, wallets } = get();
      void refreshWalletInfo({ addresses: [accountAddress], useCachedENS: true });
      return saveSelectedWalletInKeychain(wallets[walletId], accountAddress);
    },

    async removeAccount(walletId, accountAddress) {
      const previous = get();
      set(state => {
        const wallet = state.wallets[walletId];
        if (!wallet) return state;

        let changed = false;
        let hasVisibleAccount = false;
        const addresses = wallet.addresses.map(account => {
          if (account.visible && isLowerCaseMatch(account.address, accountAddress)) {
            changed = true;
            return { ...account, visible: false };
          }
          hasVisibleAccount ||= account.visible;
          return account;
        });
        if (!changed) return state;

        const wallets = { ...state.wallets };
        if (hasVisibleAccount) wallets[walletId] = { ...wallet, addresses };
        else delete wallets[walletId];

        const removingSelectedAccount = state.selectedWalletId === walletId && isLowerCaseMatch(state.accountAddress, accountAddress);
        if (!removingSelectedAccount) return { wallets };

        const selection = resolveWalletSelection(wallets, null, null);
        if (!selection) return INITIAL_WALLET_STATE;
        return { wallets, ...selection };
      });

      const current = get();
      if (current === previous) return;

      if (current.selectedWalletId === null) {
        await clearWalletKeychain();
      } else {
        const selectionChanged =
          current.selectedWalletId !== previous.selectedWalletId || current.accountAddress !== previous.accountAddress;
        await Promise.all([
          saveAllWallets(current.wallets),
          selectionChanged ? saveSelectedWalletInKeychain(current.wallets[current.selectedWalletId], current.accountAddress) : undefined,
        ]);
        if (selectionChanged) void current.refreshWalletInfo({ addresses: [current.accountAddress], useCachedENS: true });
      }

      const addressStillVisible = Object.values(current.wallets).some(wallet =>
        wallet.addresses.some(account => account.visible && isLowerCaseMatch(account.address, accountAddress))
      );
      if (!addressStillVisible) await removeWalletData(accountAddress);
    },

    updateWallets: wallets => {
      set({ wallets });
      return saveAllWallets(wallets);
    },

    async addWallet(wallet, accountAddress, replacedWalletIds = []) {
      set(state => {
        const wallets = { ...state.wallets };
        for (const id of replacedWalletIds) delete wallets[id];
        const admitted = mergeWallet(state.wallets[wallet.id], wallet);
        wallets[wallet.id] = admitted.damaged ? { ...admitted, damaged: false } : admitted;
        const selection = resolveWalletSelection(
          wallets,
          accountAddress === undefined ? state.selectedWalletId : wallet.id,
          accountAddress ?? state.accountAddress
        );
        return { wallets, ...selection };
      });

      const current = get();
      await Promise.all([
        saveAllWallets(current.wallets),
        current.selectedWalletId === null
          ? undefined
          : saveSelectedWalletInKeychain(current.wallets[current.selectedWalletId], current.accountAddress),
      ]);
      void current.refreshWalletInfo({ addresses: wallet.addresses.map(account => account.address), useCachedENS: true });
    },

    addAccountToWallet: (walletId, account) => {
      set(state => {
        const wallet = state.wallets[walletId];
        if (!wallet) throw new Error(`[walletsStore]: Wallet ${walletId} not found`);

        const updatedWallet = {
          ...wallet,
          addresses: [...wallet.addresses, account],
        };

        return {
          accountAddress: ensureValidHex(account.address),
          selectedWalletId: walletId,
          wallets: {
            ...state.wallets,
            [walletId]: updatedWallet,
          },
        };
      });

      const state = get();
      void state.refreshWalletInfo({ addresses: [account.address], useCachedENS: true });
      return state.wallets[walletId];
    },

    updateAccountInfo: ({ address, avatar, color, emoji, image, label, walletId }) => {
      set(state => {
        const { wallets } = state;
        if (!wallets[walletId]) return state;

        const updatedMetadata: Partial<Pick<RainbowAccount, 'avatar' | 'color' | 'image' | 'label'>> = {};

        if (avatar !== undefined) updatedMetadata.avatar = avatar;
        if (color !== undefined) updatedMetadata.color = color;
        if (image !== undefined) updatedMetadata.image = image;

        const updatedWallet = {
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
        };

        return {
          wallets: {
            ...wallets,
            [walletId]: updatedWallet,
          },
        };
      });
    },

    getAccountProfileInfo: providedAddress => {
      const state = get();
      const { accountAddress, getWalletWithAccount } = state;
      const selected = state.getSelectedWallet();

      const address = providedAddress || accountAddress;
      const isSelectedWallet = !providedAddress || providedAddress === accountAddress;
      const wallet = (isSelectedWallet && selected) || getWalletWithAccount(address);

      return getAccountProfileInfoFromState({ address, wallet }, state);
    },

    async clearWalletState({ resetKeychain = false } = {}) {
      if (resetKeychain) await clearWalletKeychain();
      set(() => INITIAL_WALLET_STATE);
    },

    loadWallets: async () => {
      try {
        const [selected, loadedAccountAddress, allWalletsResult] = await Promise.all([
          getSelectedWalletFromKeychain(),
          loadAddress(),
          getAllWallets(),
        ]);

        if (!allWalletsResult?.wallets) return;
        const accountAddress = isValidHex(loadedAccountAddress) ? loadedAccountAddress : null;
        const selectedWalletId = selected?.wallet?.id ?? null;

        set(state => {
          const wallets = applyWalletUpdatesFromKeychain(state.wallets, allWalletsResult.wallets);
          const selection = resolveWalletSelection(wallets, selectedWalletId, accountAddress);
          if (!selection) return INITIAL_WALLET_STATE;
          if (
            wallets === state.wallets &&
            selection.selectedWalletId === state.selectedWalletId &&
            selection.accountAddress === state.accountAddress
          ) {
            return state;
          }
          return { wallets, ...selection };
        });

        const current = get();
        if (current.selectedWalletId === null) return current.wallets;
        if (current.selectedWalletId !== selectedWalletId || current.accountAddress !== accountAddress) {
          await saveSelectedWalletInKeychain(current.wallets[current.selectedWalletId], current.accountAddress);
        }

        const { accountAddress: newAccountAddress, refreshWalletInfo } = get();

        refreshWalletInfo({ addresses: [newAccountAddress] }).then(() => {
          refreshWalletInfo({ useCachedENS: true });
        });

        return get().wallets;
      } catch (error) {
        logger.error(new RainbowError('[walletsStore]: Exception during walletsLoadState'), {
          message: ensureError(error).message,
        });
      }
    },

    setAllWalletsWithIdsAsBackedUp: async (walletIds, method, backupFile) => {
      const { wallets, selectedWalletId } = get();

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

      const shouldUpdateSelected = selectedWalletId !== null && walletIds.includes(selectedWalletId);

      set(() => ({ wallets: newWallets }));

      if (shouldUpdateSelected) {
        await Promise.all([saveAllWallets(newWallets), setSelectedWalletInKeychain(newWallets[selectedWalletId])]);
      } else {
        await saveAllWallets(newWallets);
      }
    },

    setWalletBackedUp: (walletId, method, backupFile) =>
      set(state => {
        const { wallets } = state;

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

        return { wallets: newWallets };
      }),

    async refreshWalletInfo(opts: { addresses?: string[]; useCachedENS?: boolean } = {}): Promise<void> {
      const { wallets } = get();
      const allAddresses = opts.addresses ?? Object.values(wallets).flatMap(w => w.addresses.map(a => a.address));

      if (!allAddresses.length) return;

      const target = new Set(allAddresses.map(a => a.toLowerCase()));
      const accounts = Object.entries(wallets).flatMap(([walletId, wallet]) =>
        wallet.addresses.filter(a => target.has(a.address.toLowerCase())).map(a => ({ walletId, account: a }))
      );

      if (!accounts.length) return;

      try {
        const results = await Promise.all(
          accounts.map(async ({ walletId, account }) => ({
            walletId,
            address: account.address,
            metadata: await refreshAccountInfo(account, opts.useCachedENS),
          }))
        );

        set(state => {
          const nextWallets = { ...state.wallets };
          const nextWalletNames = { ...state.walletNames };

          let walletsChanged = false;
          let namesChanged = false;

          for (const { walletId, address, metadata } of results) {
            const wallet = nextWallets[walletId];
            if (!wallet || !metadata) continue;

            let accountChanged = false;
            const updatedAddresses = wallet.addresses.map(acc => {
              if (acc.address !== address) return acc;

              const newAcc: RainbowAccount = {
                ...acc,
                emoji: acc.emoji ?? addressHashedEmoji(address) ?? undefined,
                ens: metadata.ens ?? acc.ens,
                image: metadata.image ?? acc.image,
                label: metadata.label ?? acc.label,
              };

              if (newAcc.emoji === acc.emoji && newAcc.ens === acc.ens && newAcc.image === acc.image && newAcc.label === acc.label) {
                return acc; // no change
              }

              accountChanged = true;
              return newAcc;
            });

            if (accountChanged) {
              nextWallets[walletId] = { ...wallet, addresses: updatedAddresses };
              walletsChanged = true;
            }

            if (metadata.ens) {
              if (nextWalletNames[address] !== metadata.ens) {
                nextWalletNames[address] = metadata.ens;
                namesChanged = true;
              }
            } else if (nextWalletNames[address]) {
              delete nextWalletNames[address];
              namesChanged = true;
            }
          }

          if (!walletsChanged && !namesChanged) return state;

          return {
            wallets: walletsChanged ? nextWallets : state.wallets,
            walletNames: namesChanged ? nextWalletNames : state.walletNames,
          };
        });
      } catch (e) {
        logger.error(new RainbowError('[walletsStore]: Failed to refresh metadata'), {
          addresses: [...target],
          error: ensureError(e).message,
        });
      }
    },

    checkKeychainIntegrity: async () => {
      try {
        const startTime = Date.now();
        logger.debug('[walletsStore]: Starting keychain integrity checks');

        const updatedWalletsDamagedState = await checkWalletsDamagedState(get().wallets);
        const healthyKeychain = Array.from(updatedWalletsDamagedState.values()).every(damaged => !damaged);

        set(state => {
          if (!state.wallets || updatedWalletsDamagedState.size === 0) return state;
          const updatedWallets = { ...state.wallets };

          updatedWalletsDamagedState.forEach((damaged, walletId) => {
            const curWallet = updatedWallets[walletId];
            if (curWallet.damaged !== damaged) {
              updatedWallets[walletId] = {
                ...updatedWallets[walletId],
                damaged,
              };
            }
          });

          return {
            wallets: updatedWallets,
          };
        });

        if (!healthyKeychain) {
          captureMessage('Keychain Integrity is not OK');
          const didShowWalletErrorSheet = await kc.has(didShowWalletErrorSheetKey);
          if (!didShowWalletErrorSheet) {
            Navigation.handleAction(Routes.WALLET_ERROR_SHEET);
            // Save this flag in the keychain so we only show the alert once per device transfer.
            await kc.set(didShowWalletErrorSheetKey, 'true', kc.publicAccessControlOptions);
          }
        }

        logger.debug(`[walletsStore]: check completed in ${Date.now() - startTime} ms`);
      } catch (e) {
        logger.error(new RainbowError('[walletsStore]: error thrown'), {
          message: ensureError(e).message,
        });
        captureMessage('Error running keychain integrity checks');
      }
    },

    setWalletDamaged: (walletId: string, damaged: boolean) =>
      set(state => {
        const { wallets } = state;
        const currentWallet = wallets[walletId];

        if (!currentWallet || currentWallet.damaged === damaged) return state;

        const newWallets = {
          ...wallets,
          [walletId]: {
            ...currentWallet,
            damaged,
          },
        };

        return {
          wallets: newWallets,
        };
      }),

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
      selectedWalletId: state.selectedWalletId,
      accountAddress: state.accountAddress,
      wallets: state.wallets,
      walletNames: state.walletNames,
    }),
    // v1: canonicalize EIP-55 addresses on rehydration. The watched-wallet import flow previously
    // accepted addresses without enforcing EIP-55 checksum, so non-canonical entries could end up
    // persisted (APP-3673). Normalize here so consumers always read canonical data.
    version: 2,
    migrate: (persistedState, fromVersion) => {
      const state = persistedState;
      const selectedWalletId = fromVersion < 2 ? (state.selected?.id ?? null) : (state.selectedWalletId ?? null);
      if (fromVersion < 1) {
        // Active address used by every downstream consumer (polymarket derive, displays,
        // address comparisons). This is the primary field that triggers the boot crash when
        // non-canonical because it gets fed into viem's strict EIP-55 encoder.
        if (state.accountAddress) {
          const normalized = normalizeAddress(state.accountAddress);
          if (normalized) {
            state.accountAddress = normalized;
          }
        }

        // Wallets map; powers the wallet switcher, account list, and any Copy action sourced
        // from a wallet card. Without this, switching to or copying from a non-canonical wallet
        // surfaces the bad-case form even after the active address was healed.
        if (state.wallets) {
          for (const wallet of Object.values(state.wallets)) {
            for (const account of wallet.addresses || []) {
              const normalized = normalizeAddress(account.address);
              if (normalized) {
                account.address = normalized;
              }
            }
          }
        }

        // ENS name cache, keyed by address. Post-canonicalization, lookups happen with
        // canonical-case addresses; if the keys here remain bad-case, those lookups silently
        // miss and the user's ENS names disappear. Re-key the map under canonical addresses.
        if (state.walletNames) {
          const next: WalletNames = {};
          for (const [address, ensName] of Object.entries(state.walletNames)) {
            const normalized = normalizeAddress(address);
            next[normalized ?? address] = ensName;
          }
          state.walletNames = next;
        }
      }
      return {
        accountAddress: state.accountAddress,
        selectedWalletId,
        walletNames: state.walletNames,
        wallets: state.wallets,
      };
    },
    persistThrottleMs: time.seconds(1),
  }
);

async function refreshAccountInfo(
  account: RainbowAccount,
  useCachedENS = false
): Promise<Partial<Pick<RainbowAccount, 'ens' | 'image' | 'label'>> | null> {
  try {
    if (useCachedENS && account.ens !== undefined && account.ens !== null) {
      // If we've already checked for ENS, don't check again
      return null;
    }

    const address = getAddress(account.address);
    const ens = await useEnsNameStore.getState().load(address, { force: true });

    if (ens) {
      // Only fetch avatar if ENS changed or we don't have an image
      const shouldFetchAvatar = account.ens !== ens || !account.image;
      let newImage = account.image;

      if (shouldFetchAvatar) {
        newImage = await useEnsImageStore
          .getState()
          .load({ name: ens, field: 'avatar' }, { force: true })
          .catch(() => account.image ?? null);
      }

      return {
        ens,
        image: newImage,
        label: formatAccountLabel({ address: account.address, label: account.label === account.ens ? null : account.label, ens }),
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

export const getWalletAddresses = (wallets: AllRainbowWallets | null) => {
  return getConsistentArray(
    Object.values(wallets || {}).flatMap(wallet => (wallet.addresses || []).map(account => account.address as Address))
  );
};

export function getOwnedNormalizedWalletAddresses(): string[] {
  const wallets = useWalletsStore.getState().wallets;

  if (!wallets) return [];

  return getConsistentArray(
    Object.values(wallets).flatMap(wallet => {
      if (wallet.type === WalletTypes.readOnly) return [];
      return (wallet.addresses ?? []).filter(account => account.visible).map(account => account.address.toLowerCase());
    })
  );
}

export const useAccountAddress = () => useWalletsStore(state => state.accountAddress);
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

export const useAccountProfileInfo = createDerivedStore(
  $ => {
    const isDarkMode = $(useThemeStore).isDarkMode;
    const profileInfo = $(useWalletsStore, state => state.getAccountProfileInfo(), shallowEqual);
    const name = $(useEnsNameStore, state => (profileInfo.accountAddress ? state.get(profileInfo.accountAddress) : undefined));
    const accountENS = name === undefined ? profileInfo.accountENS : (name ?? undefined);
    const hasCustomLabel =
      profileInfo.accountName &&
      profileInfo.accountName !== profileInfo.accountENS &&
      profileInfo.accountName !== profileInfo.accountAddress;

    const accountColorHex =
      typeof profileInfo?.accountColor === 'number'
        ? (isDarkMode ? darkModeThemeColors : lightModeThemeColors).avatarBackgrounds[profileInfo.accountColor]
        : '';

    return { ...profileInfo, accountENS, accountName: hasCustomLabel ? profileInfo.accountName : (accountENS ?? ''), accountColorHex };
  },
  { equalityFn: shallowEqual }
);

export const useAccountProfileInfoByAddress = (address?: Address) => {
  const { colors } = useTheme();
  const info = useWalletsStore(s => s.getAccountProfileInfo(address), dequal);
  const name = useEnsNameStore(s => s.get(info.accountAddress));
  const accountENS = name === undefined ? info.accountENS : (name ?? undefined);
  const hasCustomLabel = info.accountName && info.accountName !== info.accountENS && info.accountName !== info.accountAddress;
  return {
    ...info,
    accountENS,
    accountName: hasCustomLabel ? info.accountName : (accountENS ?? ''),
    accountColorHex: info.accountColor ? colors.avatarBackgrounds[info.accountColor] : '',
  };
};

const getAccountProfileInfoFromState = (props: { address: Address; wallet?: RainbowWallet }, state: WalletsState): AccountProfileInfo => {
  const wallet = props.wallet || state.getSelectedWallet();
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

/** A visible account and the wallet group through which it is selected. */
interface WalletSelection {
  selectedWalletId: RainbowWallet['id'];
  accountAddress: Address;
}

function resolveWalletSelection(
  wallets: AllRainbowWallets,
  selectedWalletId: RainbowWallet['id'] | null,
  accountAddress: Address | null
): WalletSelection | null {
  const selectedWallet = selectedWalletId === null ? undefined : wallets[selectedWalletId];
  if (selectedWallet) {
    let firstVisible: RainbowAccount | undefined;
    for (const account of selectedWallet.addresses) {
      if (!account.visible) continue;
      firstVisible ??= account;
      if (accountAddress && isLowerCaseMatch(account.address, accountAddress)) {
        return { selectedWalletId: selectedWallet.id, accountAddress: ensureValidHex(account.address) };
      }
    }
    if (firstVisible) return { selectedWalletId: selectedWallet.id, accountAddress: ensureValidHex(firstVisible.address) };
  }

  let firstVisible: WalletSelection | null = null;
  for (const wallet of Object.values(wallets)) {
    for (const account of wallet.addresses) {
      if (!account.visible) continue;
      if (accountAddress && isLowerCaseMatch(account.address, accountAddress)) {
        return { selectedWalletId: wallet.id, accountAddress: ensureValidHex(account.address) };
      }
      firstVisible ??= { selectedWalletId: wallet.id, accountAddress: ensureValidHex(account.address) };
    }
  }
  return firstVisible;
}

async function clearWalletKeychain(): Promise<void> {
  await cleanUpWalletKeys();
  await Promise.all([saveAddress(INITIAL_ADDRESS), resetSelectedWalletInKeychain(), saveAllWallets({})]);
}

function applyWalletUpdatesFromKeychain(storeWallets: AllRainbowWallets, keychainWallets: AllRainbowWallets): AllRainbowWallets {
  if (!Object.keys(storeWallets).length) return keychainWallets;

  let wallets = storeWallets;
  for (const [id, wallet] of Object.entries(keychainWallets)) {
    const merged = mergeWallet(wallets[id], wallet);
    if (merged === wallets[id]) continue;
    if (wallets === storeWallets) wallets = { ...wallets };
    wallets[id] = merged;
  }
  return wallets;
}

function mergeWallet(existing: RainbowWallet | undefined, incoming: RainbowWallet): RainbowWallet {
  if (!existing) return incoming;

  const addresses = new Set(existing.addresses.map(account => account.address.toLowerCase()));
  const missing = incoming.addresses.filter(account => !addresses.has(account.address.toLowerCase()));
  if (!missing.length && existing.type === incoming.type && existing.encryptionType === incoming.encryptionType) return existing;

  return {
    ...existing,
    addresses: missing.length ? [...existing.addresses, ...missing] : existing.addresses,
    type: incoming.type,
    encryptionType: incoming.encryptionType,
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

async function saveSelectedWalletInKeychain(wallet: RainbowWallet, accountAddress?: string) {
  await Promise.all([accountAddress ? saveAddress(accountAddress) : null, setSelectedWalletInKeychain(wallet)]);
}

export function checkIfReadOnlyWallet(address: string) {
  const wallet = getWalletWithAccount(address);
  if (wallet?.type === WalletTypes.readOnly) {
    watchingAlert();
    return true;
  }
  return false;
}

// export static functions
export const {
  getSelectedWallet,
  removeAccount,
  addWallet,
  addAccountToWallet,
  clearWalletState,
  checkKeychainIntegrity,
  clearAllWalletsBackupStatus,
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
  setWalletDamaged,
  updateAccountInfo,
  updateWallets,
} = useWalletsStore.getState();
