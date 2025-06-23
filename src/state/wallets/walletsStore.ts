import { saveKeychainIntegrityState } from '@/handlers/localstorage/globalSettings';
import { ensureValidHex } from '@/handlers/web3';
import { removeFirstEmojiFromString, returnStringFirstEmoji } from '@/helpers/emojiHandler';
import WalletTypes from '@/helpers/walletTypes';
import { fetchENSAvatar } from '@/hooks/useENSAvatar';
import { logger, RainbowError } from '@/logger';
import { parseTimestampFromBackupFile } from '@/model/backup';
import { hasKey } from '@/model/keychain';
import { PreferenceActionType, setPreference } from '@/model/preferences';
import {
  AllRainbowWallets,
  generateAccount,
  getAllWallets,
  getSelectedWallet as getSelectedWalletFromKeychain,
  loadAddress,
  RainbowAccount,
  RainbowWallet,
  saveAddress,
  saveAllWallets,
  setSelectedWallet as setSelectedWalletInKeychain,
} from '@/model/wallet';
import { updateWebDataEnabled } from '@/redux/showcaseTokens';
import store from '@/redux/store';
import { lightModeThemeColors } from '@/styles';
import { useTheme } from '@/theme';
import { isLowerCaseMatch } from '@/utils';
import { address as addressAbbreviation } from '@/utils/abbreviations';
import { addressKey, oldSeedPhraseMigratedKey, privateKeyKey, seedPhraseKey } from '@/utils/keychainConstants';
import { addressHashedColorIndex, addressHashedEmoji, fetchReverseRecordWithRetry, isValidImagePath } from '@/utils/profileUtils';
import { captureMessage } from '@sentry/react-native';
import { dequal } from 'dequal';
import { toChecksumAddress } from 'ethereumjs-util';
import { isEmpty, keys } from 'lodash';
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
type Wallets = { [id: string]: RainbowWallet };

interface WalletsState {
  walletReady: boolean;
  setWalletReady: () => void;

  selected: RainbowWallet | null;
  setSelectedWallet: (wallet: RainbowWallet, address?: string) => void;

  walletNames: WalletNames;
  wallets: Wallets | null;
  updateWallets: (wallets: { [id: string]: RainbowWallet }) => void;

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

  refreshWalletInfo: (props?: { skipENS?: boolean }) => Promise<void>;

  checkKeychainIntegrity: () => Promise<void>;

  getIsDamagedWallet: () => boolean;
  getIsReadOnlyWallet: () => boolean;
  getIsHardwareWallet: () => boolean;
  getWalletWithAccount: (accountAddress: string) => RainbowWallet | undefined;

  clearWalletState: () => void;
}

export const useWalletsStore = createRainbowStore<WalletsState>(
  (set, get) => ({
    getIsDamagedWallet: () => !!get().selected?.damaged,
    getIsReadOnlyWallet: () => get().selected?.type === WalletTypes.readOnly,
    getIsHardwareWallet: () => !!get().selected?.deviceId,

    selected: null,
    setSelectedWallet(wallet, address) {
      setSelectedWalletInKeychain(wallet);

      // ensure not memoized
      const selected = {
        ...wallet,
      };

      if (address) {
        console.log('set selected new', address);
        saveAddress(address);
        set({
          accountAddress: ensureValidHex(address),
          selected,
        });
      } else {
        set({
          selected,
        });
      }
    },

    walletNames: {},

    wallets: null,
    updateWallets(wallets) {
      saveAllWallets(wallets);
      set({
        // ensure its a new object to break any memoization downstream
        wallets: {
          ...wallets,
        },
      });
    },

    walletReady: false,
    setWalletReady: () => {
      set({ walletReady: true });
    },

    // TODO follow-on and fix this type better - this is matching existing bug from before refactor
    // see PD-188
    accountAddress: `0x`,
    setAccountAddress: (accountAddress: Address) => {
      console.log('setting acc', accountAddress);
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

    clearWalletState() {
      set({
        wallets: {},
        accountAddress: `0x`,
        walletReady: false,
        walletNames: {},
        selected: null,
      });
    },

    async loadWallets() {
      try {
        const { accountAddress, walletNames } = get();

        let nextAccountAddress: string | null =
          accountAddress ||
          // @ts-expect-error this migrates from the old wallet store which had the state here
          store.getState().settings['accountAddress'];

        console.log('loading', accountAddress, store.getState().settings);

        const allWalletsResult = await getAllWallets();

        const wallets = allWalletsResult?.wallets || {};

        if (isEmpty(wallets)) return;

        const selected = await getSelectedWalletFromKeychain();

        console.log('loaded selected', JSON.stringify(selected, null, 2));

        // Prevent irrecoverable state (no selected wallet)
        let selectedWallet = selected?.wallet;

        // Check if the selected wallet is among all the wallets
        if (selectedWallet && !wallets[selectedWallet.id]) {
          // If not then we should clear it and default to the first one
          const firstWalletKey = Object.keys(wallets)[0];
          selectedWallet = wallets[firstWalletKey];
          setSelectedWallet(selectedWallet);
        }

        if (!selectedWallet) {
          const address = await loadAddress();
          if (!address) {
            selectedWallet = wallets[Object.keys(wallets)[0]];
          } else {
            keys(wallets).some(key => {
              const someWallet = wallets[key];
              const found = (someWallet.addresses || []).some(account => {
                return toChecksumAddress(account.address) === toChecksumAddress(address);
              });
              if (found) {
                selectedWallet = someWallet;
                logger.debug('[walletsStore]: Found selected wallet based on loadAddress result');
              }
              return found;
            });
          }
        }

        // Recover from broken state (account address not in selected wallet)
        if (!nextAccountAddress) {
          nextAccountAddress = await loadAddress();
          logger.debug("[walletsStore]: nextAccountAddress wasn't set on settings so it is being loaded from loadAddress");
        }

        const selectedAddress = selectedWallet?.addresses.find(a => {
          return a.visible && a.address === nextAccountAddress;
        });

        // Let's select the first visible account if we don't have a selected address
        if (!selectedAddress) {
          const allWallets = Object.values(allWalletsResult?.wallets || {});
          let account = null;
          for (const wallet of allWallets) {
            for (const rainbowAccount of wallet.addresses || []) {
              if (rainbowAccount.visible) {
                account = rainbowAccount;
                break;
              }
            }
          }

          if (!account) return;
          nextAccountAddress = account.address;
          setAccountAddress(ensureValidHex(account.address));
          saveAddress(account.address);
          logger.debug('[walletsStore]: Selected the first visible address because there was not selected one');
        }

        const walletInfo = await refreshWalletsInfo({ wallets, walletNames, useCachedENS: true });

        set(walletInfo);
        if (selectedWallet) {
          setSelectedWallet(selectedWallet, nextAccountAddress ? ensureValidHex(nextAccountAddress) : undefined);
        }

        return wallets;
      } catch (error) {
        logger.error(new RainbowError('[walletsStore]: Exception during walletsLoadState'), {
          message: (error as Error)?.message,
        });
      }
    },

    createAccount: async ({ id, name, color }) => {
      const { wallets, walletNames } = get();
      const newWallets = { ...wallets };

      let index = 0;
      for (const account of newWallets[id].addresses) {
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

      newWallets[id].addresses.push({
        address: account.address,
        avatar: null,
        color: walletColorIndex,
        index: newIndex,
        label: name,
        visible: true,
      });

      store.dispatch(updateWebDataEnabled(true, account.address));

      setPreference(PreferenceActionType.init, 'profile', account.address, {
        accountColor: lightModeThemeColors.avatarBackgrounds[walletColorIndex],
        accountSymbol: addressHashedEmoji(account.address),
      });

      // Save all the wallets
      saveAllWallets(newWallets);
      // Set the address selected (KEYCHAIN)
      saveAddress(account.address);
      // Set the wallet selected (KEYCHAIN)
      setSelectedWallet(newWallets[id], account.address);

      set({
        selected: newWallets[id],
        ...(await refreshWalletsInfo({ wallets: newWallets, walletNames, useCachedENS: true })),
      });

      setAccountAddress(ensureValidHex(account.address));

      return newWallets;
    },

    setAllWalletsWithIdsAsBackedUp: (walletIds, method, backupFile) => {
      const { wallets, selected, updateWallets, setSelectedWallet } = get();

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

      updateWallets(newWallets);

      if (selected?.id && walletIds.includes(selected?.id)) {
        setSelectedWallet(newWallets[selected.id]);
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

    refreshWalletInfo: async props => {
      const { wallets, walletNames } = get();
      const info = await refreshWalletsInfo({ wallets, walletNames, useCachedENS: props?.skipENS });
      if (info) {
        set(info);
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
        if (!wallets) {
          logger.warn('[walletsStore]: wallets are missing from redux');
          return;
        }

        if (!selected) {
          logger.warn('[walletsStore]: selectedWallet is missing from redux');
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
    partialize: state => ({
      selected: state.selected,
      accountAddress: state.accountAddress,
      wallets: state.wallets,
      walletNames: state.walletNames,
    }),
  }
);

type GetENSInfoProps = { wallets: Wallets | null; walletNames: WalletNames; useCachedENS?: boolean };

async function refreshWalletsInfo({ wallets, useCachedENS }: GetENSInfoProps) {
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
          const account = await refreshAccountInfo(ogAccount, useCachedENS);
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

async function refreshAccountInfo(account: RainbowAccount, useCachedENS = false): Promise<RainbowAccount> {
  const label = removeFirstEmojiFromString(account.label || addressAbbreviation(account.address, 4, 4));

  if (useCachedENS && account.label && account.avatar) {
    if (account.label === label) {
      return account;
    }

    return {
      ...account,
      label,
    };
  }

  const ens = await fetchReverseRecordWithRetry(account.address);

  if (ens) {
    const avatar = await fetchENSAvatar(ens);
    const newImage = avatar?.imageUrl || null;
    return {
      ...account,
      image: newImage,
      // always prefer our label
      label: account.label ? label : ens,
    };
  }

  return account;
}

export const useWallets = () => useWalletsStore(state => state.wallets);
export const useWallet = (id: string) => useWallets()?.[id];
export const getAccountAddress = () => useWalletsStore.getState().accountAddress;
export const getWallets = () => useWalletsStore.getState().wallets;
export const getSelectedWallet = () => useWalletsStore.getState().selected;
export const getWalletReady = () => useWalletsStore.getState().walletReady;

export const getWalletAddresses = (wallets: Wallets) => {
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
  const { walletNames } = state;
  const address = props.address || state.accountAddress;

  if (!wallet || !address) {
    return {
      accountAddress: address,
      accountColor: 0,
    };
  }

  const selectedAccount = wallet.addresses?.find(account => isLowerCaseMatch(account.address, address));

  if (!selectedAccount) {
    return {
      accountAddress: address,
      accountColor: 0,
    };
  }

  const { label, color, image } = selectedAccount;
  const labelWithoutEmoji = label && removeFirstEmojiFromString(label);
  const accountENS = walletNames?.[address] || '';
  const accountName = labelWithoutEmoji || accountENS || addressAbbreviation(address, 4, 4);
  const emojiAvatar = returnStringFirstEmoji(label);
  const accountSymbol = returnStringFirstEmoji(emojiAvatar || addressHashedEmoji(address));
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
} = useWalletsStore.getState();
