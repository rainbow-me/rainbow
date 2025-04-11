import { fetchReverseRecord } from '@/handlers/ens';
import WalletTypes from '@/helpers/walletTypes';
import { logger, RainbowError } from '@/logger';
import { parseTimestampFromBackupFile } from '@/model/backup';
import store from '@/redux/store';
import { lightModeThemeColors } from '@/styles';
import { captureMessage } from '@sentry/react-native';
import { toChecksumAddress } from 'ethereumjs-util';
import { isEmpty, keys } from 'lodash';
import { saveKeychainIntegrityState } from '../handlers/localstorage/globalSettings';
import { getWalletNames, saveWalletNames } from '../handlers/localstorage/walletNames';
import { removeFirstEmojiFromString, returnStringFirstEmoji } from '../helpers/emojiHandler';
import { fetchENSAvatar } from '../hooks/useENSAvatar';
import { hasKey } from '../model/keychain';
import { PreferenceActionType, setPreference } from '../model/preferences';
import {
  AllRainbowWallets,
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
import { createRainbowStore } from '../state/internal/createRainbowStore';
import { address } from '../utils/abbreviations';
import { addressKey, oldSeedPhraseMigratedKey, privateKeyKey, seedPhraseKey } from '../utils/keychainConstants';
import { addressHashedColorIndex, addressHashedEmoji, fetchReverseRecordWithRetry, isValidImagePath } from '../utils/profileUtils';
import { updateWebDataEnabled } from './showcaseTokens';

interface WalletsState {
  selected: RainbowWallet | null;
  setSelectedWallet: (wallet: RainbowWallet) => Promise<void>;

  walletNames: { [address: string]: string };
  updateWalletNames: (names: { [address: string]: string }) => void;

  wallets: { [id: string]: RainbowWallet } | null;
  updateWallets: (wallets: { [id: string]: RainbowWallet }) => Promise<void>;

  loadWallets: () => Promise<AllRainbowWallets | void>;

  createAccount: (data: Pick<RainbowWallet, 'id' | 'name' | 'color'>) => void;

  setAllWalletsWithIdsAsBackedUp: (
    ids: RainbowWallet['id'][],
    method: RainbowWallet['backupType'],
    backupFile?: RainbowWallet['backupFile']
  ) => void;

  setWalletBackedUp: (id: RainbowWallet['id'], method: RainbowWallet['backupType'], backupFile?: RainbowWallet['backupFile']) => void;

  clearAllWalletsBackupStatus: () => void;

  setSelectedAddress: (address: string) => void;

  accountAddress: string;
  updateAccountAddress: (address: string) => void;

  refreshWalletENSAvatars: () => Promise<void>;
  refreshWalletNames: () => Promise<void>;
  checkKeychainIntegrity: () => Promise<void>;

  getIsDamaged: () => boolean;
  getIsReadOnlyWallet: () => boolean;
  getIsHardwareWallet: () => boolean;
  getWalletWithAccount: (accountAddress: string) => RainbowWallet | undefined;
  getAccountProfileInfo: (props?: { address: string; wallet?: RainbowWallet }) => {
    accountAddress: string;
    accountColor: number;
    accountENS: string;
    accountImage: string | null;
    accountName: string;
    accountSymbol: string | false;
  };
}

export const useWalletsStore = createRainbowStore<WalletsState>((set, get) => ({
  getIsDamaged: () => !!get().selected?.damaged,
  getIsReadOnlyWallet: () => get().selected?.type === WalletTypes.readOnly,
  getIsHardwareWallet: () => !!get().selected?.deviceId,

  selected: null,
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

  accountAddress: '',
  updateAccountAddress: (accountAddress: string) => {
    set({
      accountAddress,
    });
  },

  async loadWallets() {
    try {
      const { accountAddress } = get();
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
            const found = (someWallet.addresses || []).some(account => {
              return toChecksumAddress(account.address) === toChecksumAddress(address!);
            });
            if (found) {
              selectedWallet = someWallet;
              logger.debug('[redux/wallets]: Found selected wallet based on loadAddress result');
            }
            return found;
          });
        }
      }

      // Recover from broken state (account address not in selected wallet)
      if (!addressFromKeychain) {
        addressFromKeychain = await loadAddress();
        logger.debug("[redux/wallets]: addressFromKeychain wasn't set on settings so it is being loaded from loadAddress");
      }

      const selectedAddress = selectedWallet?.addresses.find(a => {
        return a.visible && a.address === addressFromKeychain;
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
        set({
          accountAddress: account.address,
        });
        await saveAddress(account.address);
        logger.debug('[redux/wallets]: Selected the first visible address because there was not selected one');
      }

      const walletNames = await getWalletNames();
      set({
        selected: selectedWallet,
        walletNames,
        wallets,
      });

      return wallets;
    } catch (error) {
      logger.error(new RainbowError('[redux/wallets]: Exception during walletsLoadState'), {
        message: (error as Error)?.message,
      });
    }
  },

  createAccount: async ({ id, name, color }) => {
    const { wallets } = get();
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
    await saveAddress(account.address);

    // Set the wallet selected (KEYCHAIN)
    await setSelectedWallet(newWallets[id]);

    set({ selected: newWallets[id], wallets: newWallets });

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

  setSelectedAddress: (address: string) => {
    saveAddress(address);
  },

  refreshWalletENSAvatars: async () => {
    const { wallets, walletNames } = get();

    if (!wallets) {
      throw new Error(`No wallets`);
    }

    const walletKeys = Object.keys(wallets);

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
      const wallet = wallets[key];
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
      const addresses = wallets[key]?.addresses;
      if (!addresses) return;

      const index = addresses.findIndex(({ address }) => address === account.address);
      addresses.splice(index, 1, account);

      updatedWallets = {
        ...(updatedWallets ?? wallets),
        [key]: {
          ...wallets[key],
          addresses,
        },
      };
    });

    if (updatedWallets) {
      set({
        wallets: updatedWallets,
      });
    }
  },

  refreshWalletNames: async () => {
    const { wallets } = get();
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

    set({
      walletNames: updatedWalletNames,
    });
    saveWalletNames(updatedWalletNames);
  },

  checkKeychainIntegrity: async () => {
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

      const { wallets, selected } = get();
      if (!wallets) {
        logger.warn('[redux/wallets]: wallets are missing from redux');
        return;
      }

      if (!selected) {
        logger.warn('[redux/wallets]: selectedWallet is missing from redux');
      }

      const nonReadOnlyWalletKeys = keys(wallets).filter(key => wallets[key].type !== WalletTypes.readOnly);

      for (const key of nonReadOnlyWalletKeys) {
        let healthyWallet = true;
        const wallet = wallets[key];

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
          set({
            wallets,
          });

          // Update selected wallet if needed
          if (wallets && selected && wallet.id === selected.id) {
            logger.warn('[redux/wallets]: declaring selected wallet unhealthy...');
            set({
              selected: wallets[wallet.id],
            });
          }
          logger.debug('[redux/wallets]: done updating wallets');
        }
      }

      if (!healthyKeychain) {
        captureMessage('Keychain Integrity is not OK');
      }

      logger.debug('[redux/wallets]: check completed');
      saveKeychainIntegrityState('done');
    } catch (e) {
      logger.error(new RainbowError("[redux/wallets]: error thrown'"), {
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
    const sortedKeys = Object.keys(wallets).sort();
    let walletWithAccount: RainbowWallet | undefined;
    const lowerCaseAccountAddress = accountAddress.toLowerCase();
    sortedKeys.forEach(key => {
      const wallet = wallets[key];
      const found = wallet.addresses?.find((account: RainbowAccount) => account.address?.toLowerCase() === lowerCaseAccountAddress);
      if (found) {
        walletWithAccount = wallet;
      }
    });
    return walletWithAccount;
  },

  getAccountProfileInfo(props) {
    const { walletNames } = get();
    const wallet = props?.wallet || get().selected;
    const accountAddress = props?.address || get().accountAddress;

    if (!wallet) {
      throw new Error(`No wallet`);
    }
    if (!accountAddress) {
      throw new Error(`No accountAddress`);
    }
    if (!wallet?.addresses?.length) {
      throw new Error(`No addresses`);
    }

    const accountENS = walletNames?.[accountAddress];
    const lowerCaseAccountAddress = accountAddress.toLowerCase();
    const selectedAccount = wallet.addresses?.find((account: RainbowAccount) => account.address?.toLowerCase() === lowerCaseAccountAddress);

    if (!selectedAccount) {
      throw new Error(`No selectedAccount`);
    }

    const { label, color, image } = selectedAccount;
    const labelWithoutEmoji = label && removeFirstEmojiFromString(label);
    const accountName = labelWithoutEmoji || accountENS || address(accountAddress, 4, 4);
    const emojiAvatar = returnStringFirstEmoji(label);
    const accountSymbol = returnStringFirstEmoji(emojiAvatar || addressHashedEmoji(accountAddress));
    const accountColor = color;
    const accountImage = image && isValidImagePath(image) ? image : null;

    return {
      accountAddress,
      accountColor,
      accountENS,
      accountImage,
      accountName,
      accountSymbol,
    };
  },
}));
