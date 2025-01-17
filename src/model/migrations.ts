import path from 'path';
import { captureException } from '@sentry/react-native';
import { findKey, isEmpty, isNumber, keys } from 'lodash';
import uniq from 'lodash/uniq';
import RNFS from 'react-native-fs';
import { MMKV } from 'react-native-mmkv';
import FastImage from 'react-native-fast-image';
import { deprecatedRemoveLocal, getGlobal } from '../handlers/localstorage/common';
import { IMAGE_METADATA } from '../handlers/localstorage/globalSettings';
import { getMigrationVersion, setMigrationVersion } from '../handlers/localstorage/migrations';
import WalletTypes from '../helpers/walletTypes';
import { BooleanMap } from '../hooks/useCoinListEditOptions';
import store from '../redux/store';
import { walletsSetSelected, walletsUpdate } from '../redux/wallets';
import { RB_TOKEN_LIST_CACHE, RB_TOKEN_LIST_ETAG } from '../references/rainbow-token-list';
import colors, { getRandomColor } from '../styles/colors';
import {
  addressKey,
  allWalletsKey,
  analyticsUserIdentifier,
  oldSeedPhraseMigratedKey,
  seedPhraseKey,
  selectedWalletKey,
  signingWallet,
  signingWalletAddress,
} from '../utils/keychainConstants';
import { hasKey, loadString, publicAccessControlOptions, saveString } from './keychain';
import { DEFAULT_WALLET_NAME, loadAddress, RainbowAccount, RainbowWallet, saveAddress } from './wallet';
import { getAssets, getHiddenCoins, getPinnedCoins, saveHiddenCoins, savePinnedCoins } from '@/handlers/localstorage/accountLocal';
import { getContacts, saveContacts } from '@/handlers/localstorage/contacts';
import { resolveNameOrAddress } from '@/handlers/web3';
import { returnStringFirstEmoji } from '@/helpers/emojiHandler';
import { updateWebDataEnabled } from '@/redux/showcaseTokens';
import { ethereumUtils, profileUtils } from '@/utils';
import { review } from '@/storage';
import { logger, RainbowError } from '@/logger';
import { queryClient } from '@/react-query';
import { favoritesQueryKey } from '@/resources/favorites';
import { EthereumAddress, RainbowToken } from '@/entities';
import { standardizeUrl, useFavoriteDappsStore } from '@/state/browser/favoriteDappsStore';
import { useLegacyFavoriteDappsStore } from '@/state/legacyFavoriteDapps';
import { getAddressAndChainIdFromUniqueId, getUniqueId, getUniqueIdNetwork } from '@/utils/ethereumUtils';
import { ParsedAssetsDictByChain, ParsedSearchAsset, UniqueId } from '@/__swaps__/types/assets';
import { userAssetsStore } from '@/state/assets/userAssets';
import { userAssetsQueryKey } from '@/__swaps__/screens/Swap/resources/assets/userAssets';
import { useConnectedToAnvilStore } from '@/state/connectedToAnvil';
import { selectorFilterByUserChains, selectUserAssetsList } from '@/__swaps__/screens/Swap/resources/_selectors/assets';
import { UnlockableAppIconKey, unlockableAppIcons } from '@/appIcons/appIcons';
import { unlockableAppIconStorage } from '@/featuresToUnlock/unlockableAppIconCheck';

export default async function runMigrations() {
  // get current version
  const currentVersion = Number(await getMigrationVersion());
  const migrations = [];
  const mmkv = new MMKV();

  /*
   *************** Migration v0 ******************
   * This step rewrites public keys to the keychain
   * using the updated Keychain settings (THIS_DEVICE_ONLY)
   */
  const v0 = async () => {
    const walletAddress = await loadAddress();
    if (walletAddress) {
      logger.debug('[runMigrations]: v0 migration - Save loaded address');
      await saveAddress(walletAddress);
    }
  };

  migrations.push(v0);

  /*
   *************** Migration v1 ******************
   * This step handles the migration to multiwallet
   * adding backwards compatibility for single wallets
   * that were created / imported before we launched this feature
   */
  const v1 = async () => {
    const { selected } = store.getState().wallets;

    if (!selected) {
      // Read from the old wallet data
      const address = await loadAddress();
      if (address) {
        logger.debug('[runMigrations]: v1 migration - address found');
        const id = `wallet_${Date.now()}`;
        const currentWallet = {
          addresses: [
            {
              address,
              avatar: null,
              color: getRandomColor(),
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
          type: WalletTypes.mnemonic,
        };

        const wallets = { [id]: currentWallet };

        logger.debug('[runMigrations]: v1 migration - update wallets and selected wallet');
        await store.dispatch(walletsUpdate(wallets));
        await store.dispatch(walletsSetSelected(currentWallet));
      }
    }
  };

  migrations.push(v1);

  /*
   *************** Migration v2 ******************
   * This step handles the addition of "primary wallets"
   * which are the only wallets allowed to create new accounts under it
   */
  const v2 = async () => {
    const { wallets, selected } = store.getState().wallets;

    if (!wallets) {
      logger.debug('[runMigrations]: Complete migration v2 early');
      return;
    }

    // Check if we have a primary wallet
    const primaryWallet = findKey(wallets, ['primary', true]);

    // If there's no primary wallet, we need to find
    // if there's a wallet with seed phrase that wasn't imported
    // and set it as primary
    if (!primaryWallet) {
      logger.debug('[runMigrations]: v2 migration - primary wallet not found');
      let primaryWalletKey = null;
      Object.keys(wallets).some(key => {
        const wallet = wallets[key];
        if (wallet.type === WalletTypes.mnemonic && !wallet.imported) {
          primaryWalletKey = key;
          return true;
        }
        return false;
      });

      // If there's no wallet with seed phrase that wasn't imported
      // let's find a wallet with seed phrase that was imported
      if (!primaryWalletKey) {
        Object.keys(wallets).some(key => {
          const wallet = wallets[key];
          if (wallet.type === WalletTypes.mnemonic) {
            primaryWalletKey = key;
            return true;
          }
          return false;
        });
      }

      if (primaryWalletKey) {
        const updatedWallets = { ...wallets };
        updatedWallets[primaryWalletKey] = {
          ...updatedWallets[primaryWalletKey],
          primary: true,
        };
        logger.debug('[runMigrations]: v2 migration - update wallets');
        await store.dispatch(walletsUpdate(updatedWallets));
        // Additionally, we need to check if it's the selected wallet
        // and if that's the case, update it too
        if (selected!.id === primaryWalletKey) {
          const updatedSelectedWallet = updatedWallets[primaryWalletKey];
          await store.dispatch(walletsSetSelected(updatedSelectedWallet));
        }
      }
    }
  };

  migrations.push(v2);

  /*
   *************** Migration v3 ******************
   * Not in use
   */

  const v3 = async () => {
    logger.debug('[runMigrations]: Ignoring migration v3');
    return true;
  };

  migrations.push(v3);

  /*
   *************** Migration v4 ******************
   * Not in use
   */

  const v4 = async () => {
    logger.debug('[runMigrations]: Ignoring migration v4');
    return true;
  };

  migrations.push(v4);

  /*
   *************** Migration v5 ******************
   * This step makes sure there are no wallets marked as damaged
   * incorrectly by the keychain integrity checks
   */
  const v5 = async () => {
    const { wallets, selected } = store.getState().wallets;

    if (!wallets) {
      logger.debug('[runMigrations]: Complete migration v5 early');
      return;
    }

    const hasMigratedFlag = await hasKey(oldSeedPhraseMigratedKey);
    if (!hasMigratedFlag) {
      logger.debug('[runMigrations]: Migration flag not set');
      const hasOldSeedphraseKey = await hasKey(seedPhraseKey);
      if (hasOldSeedphraseKey) {
        logger.debug('[runMigrations]: Old seedphrase is still there');
        let incorrectDamagedWalletId = null;
        const updatedWallets = { ...wallets };
        keys(updatedWallets).forEach(walletId => {
          if (updatedWallets[walletId].damaged && !updatedWallets[walletId].imported) {
            logger.debug(`[runMigrations]: found incorrect damaged wallet ${walletId}`);
            delete updatedWallets[walletId].damaged;
            incorrectDamagedWalletId = walletId;
          }
        });
        logger.debug('[runMigrations]: updating all wallets');
        await store.dispatch(walletsUpdate(updatedWallets));
        logger.debug('[runMigrations]: done updating all wallets');
        // Additionally, we need to check if it's the selected wallet
        // and if that's the case, update it too
        if (selected!.id === incorrectDamagedWalletId) {
          logger.debug('[runMigrations]: need to update the selected wallet');
          const updatedSelectedWallet = updatedWallets[incorrectDamagedWalletId];
          await store.dispatch(walletsSetSelected(updatedSelectedWallet));
          logger.debug('[runMigrations]: selected wallet updated');
        }
      }
    }
  };

  migrations.push(v5);

  /**
   * NOTICE: this migration is no longer in use. userLists has been removed.
   */
  /* Fix dollars => stablecoins */
  const v6 = async () => {
    logger.debug('[runMigrations]: Ignoring migration v6');
    // try {
    //   const userLists = await getUserLists();
    //   const newLists = userLists.map((list: { id: string }) => {
    //     if (list?.id !== 'dollars') {
    //       return list;
    //     }
    //     return DefaultTokenLists['mainnet'].find(
    //       ({ id }) => id === 'stablecoins'
    //     );
    //   });
    //   await saveUserLists(newLists);
    // } catch (e) {
    //   logger.log('ignoring lists migrations');
    // }
  };

  migrations.push(v6);

  /* Turning ON web data for all accounts */
  const v7 = async () => {
    const { wallets } = store.getState().wallets;
    if (!wallets) return;
    const walletKeys = Object.keys(wallets);
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < walletKeys.length; i++) {
      const wallet = wallets[walletKeys[i]];
      if (wallet.type !== WalletTypes.readOnly) {
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let x = 0; x < (wallet.addresses || []).length; x++) {
          const { address } = (wallet.addresses || [])[x];
          logger.debug(`[runMigrations]: setting web profiles for address ${address}`);
          await store.dispatch(updateWebDataEnabled(true, address));
        }
      }
    }
  };

  migrations.push(v7);

  const v8 = async () => {
    logger.debug('[runMigrations]: wiping old metadata');
    await deprecatedRemoveLocal(IMAGE_METADATA);
  };

  migrations.push(v8);

  /*
   *************** Migration v9 ******************
   * This step makes sure all wallets' color property (index)
   * are updated to point to the new webProfile colors. Do the
   * same for contacts
   */
  const v9 = async () => {
    // map from old color index to closest new color's index
    const newColorIndexes = [0, 4, 12, 21, 1, 20, 4, 9, 10];
    try {
      const { selected, wallets } = store.getState().wallets;
      if (!wallets) return;
      const walletKeys = Object.keys(wallets);
      const updatedWallets = { ...wallets };
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < walletKeys.length; i++) {
        const wallet = wallets[walletKeys[i]];
        const newAddresses = (wallet.addresses || []).map((account: RainbowAccount) => {
          const accountEmoji = returnStringFirstEmoji(account?.label);
          return {
            ...account,
            ...(!accountEmoji && {
              label: `${profileUtils.addressHashedEmoji(account.address)} ${account.label}`,
            }),
            color: (accountEmoji ? newColorIndexes[account.color] : profileUtils.addressHashedColorIndex(account.address)) || 0,
          };
        });
        const newWallet = { ...wallet, addresses: newAddresses };
        updatedWallets[walletKeys[i]] = newWallet;
      }
      logger.debug('[runMigrations]: update wallets in store to index new colors');
      await store.dispatch(walletsUpdate(updatedWallets));

      const selectedWalletId = selected?.id;
      if (selectedWalletId) {
        logger.debug('[runMigrations]: update selected wallet to index new color');
        await store.dispatch(walletsSetSelected(updatedWallets[selectedWalletId]));
      }

      // migrate contacts to new color index
      const contacts = await getContacts();
      const updatedContacts = { ...contacts };
      if (!contacts) return;
      const contactKeys = Object.keys(contacts);
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let j = 0; j < contactKeys.length; j++) {
        const contact = contacts[contactKeys[j]];
        updatedContacts[contactKeys[j]] = {
          ...contact,
          color: isNumber(contact.color)
            ? newColorIndexes[contact.color]
            : typeof contact.color === 'string' && colors.avatarBackgrounds.includes(contact.color)
              ? colors.avatarBackgrounds.indexOf(contact.color)
              : getRandomColor(),
        };
      }
      logger.debug('[runMigrations]: update contacts to index new colors');
      await saveContacts(updatedContacts);
    } catch (error) {
      logger.error(new RainbowError(`[runMigrations]: Migration v9 failed: ${error}`));
    }
  };

  migrations.push(v9);

  /*
   *************** Migration v10 ******************
   * This step makes sure all contacts have an emoji set based on the address
   */
  const v10 = async () => {
    try {
      // migrate contacts to corresponding emoji
      const contacts = await getContacts();
      const updatedContacts = { ...contacts };
      if (!contacts) return;
      const contactKeys = Object.keys(contacts);
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let j = 0; j < contactKeys.length; j++) {
        const contact = contacts[contactKeys[j]];
        let nickname = contact.nickname;
        if (!returnStringFirstEmoji(nickname)) {
          let address = null;
          try {
            address = await resolveNameOrAddress(contact.address);
            if (address) {
              const emoji = profileUtils.addressHashedEmoji(address);
              const color = profileUtils.addressHashedColorIndex(address);
              nickname = `${emoji} ${nickname}`;
              updatedContacts[contactKeys[j]] = {
                ...contact,
                color,
                nickname,
              };
            }
          } catch (error) {
            const migrationError = new Error(`Error during v10 migration contact address resolution for ${contact.address}`);
            captureException(migrationError);
            continue;
          }
        }
      }
      logger.debug('[runMigrations]: update contacts to add emojis / colors');
      await saveContacts(updatedContacts);
    } catch (error) {
      logger.error(new RainbowError(`[runMigrations]: Migration v10 failed: ${error}`));
    }
  };

  migrations.push(v10);

  /*
   *************** Migration v11 ******************
   * This step resets review timers if we havnt asked in the last 2 weeks prior to running this
   */
  const v11 = async () => {
    const hasReviewed = review.get(['hasReviewed']);
    if (hasReviewed) {
      logger.debug('[runMigrations]: Migration v11: exiting early - already reviewed');
      return;
    }

    const reviewAsked = review.get(['timeOfLastPrompt']);
    const TWO_WEEKS = 14 * 24 * 60 * 60 * 1000;
    const TWO_MONTHS = 2 * 30 * 24 * 60 * 60 * 1000;

    if (Number(reviewAsked) > Date.now() - TWO_WEEKS) {
      logger.debug('[runMigrations]: Migration v11: exiting early - not reviewed in the last 2 weeks');
      return;
    }

    review.set(['timeOfLastPrompt'], Date.now() - TWO_MONTHS);
    logger.debug('[runMigrations]: Migration v11: updated review timeOfLastPrompt');
  };

  migrations.push(v11);

  /*
   *************** Migration v12 ******************
   * Migrates the hidden and pinned l2 assets to new format
   */
  const v12 = async () => {
    const { network } = store.getState().settings;
    const { wallets } = store.getState().wallets;
    if (!wallets) return;
    const walletKeys = Object.keys(wallets);
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < walletKeys.length; i++) {
      const wallet = wallets[walletKeys[i]];
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let x = 0; x < (wallet.addresses || []).length; x++) {
        const { address } = (wallet.addresses || [])[x];

        const assets = await getAssets(address, network);
        const hiddenCoins = await getHiddenCoins(address, network);
        const pinnedCoins = await getPinnedCoins(address, network);

        logger.debug(`[runMigrations]: pinnedCoins: ${JSON.stringify({ pinnedCoins }, null, 2)}`);
        logger.debug(`[runMigrations]: hiddenCoins: ${JSON.stringify({ hiddenCoins }, null, 2)}`);

        const pinnedCoinsMigrated = pinnedCoins.map((address: string) => {
          const asset = assets?.find((asset: any) => asset.address === address.toLowerCase());
          return getUniqueIdNetwork(asset?.address, network);
        });

        const hiddenCoinsMigrated = hiddenCoins.map((address: string) => {
          const asset = ethereumUtils.getAsset(assets, address);
          return getUniqueIdNetwork(asset?.address, network);
        });

        logger.debug(`[runMigrations]: pinnedCoinsMigrated: ${JSON.stringify({ pinnedCoinsMigrated }, null, 2)}`);
        logger.debug(`[runMigrations]: hiddenCoinsMigrated: ${JSON.stringify({ hiddenCoinsMigrated }, null, 2)}`);

        await savePinnedCoins(uniq(pinnedCoinsMigrated), address, network);
        await saveHiddenCoins(uniq(hiddenCoinsMigrated), address, network);
      }
    }
  };

  migrations.push(v12);

  /*
   *************** Migration v13 ******************
   * Migrates the public keychain items to the new setting
   */
  const v13 = async () => {
    try {
      const keysToMigrate = [
        analyticsUserIdentifier,
        allWalletsKey,
        addressKey,
        selectedWalletKey,
        oldSeedPhraseMigratedKey,
        signingWallet,
        signingWalletAddress,
      ];

      // Add existing signatures
      // which look like'signature_0x...'
      const { wallets } = store.getState().wallets;
      if (Object.keys(wallets!).length > 0) {
        for (const wallet of Object.values(wallets!)) {
          for (const account of (wallet as RainbowWallet).addresses) {
            keysToMigrate.push(`signature_${account.address}`);
          }
        }
      }

      for (const key of keysToMigrate) {
        try {
          const value = await loadString(key);
          if (typeof value === 'string') {
            await saveString(key, value, publicAccessControlOptions);
            logger.debug(`[runMigrations]: key migrated: ${key}`);
          }
        } catch (error) {
          logger.error(new RainbowError(`[runMigrations]: Error migration 13 :: key ${key}: ${error}`));
        }
      }
    } catch (error) {
      logger.error(new RainbowError(`[runMigrations]: Migration v13 failed: ${error}`));
    }
  };

  migrations.push(v13);

  /*
   *************** Migration v14 ******************
   * Migrates from local storage to mmkv
   * for hidden coins, pinned coins, savings toggle, and open families
   */
  const v14 = async () => {
    const { network } = store.getState().settings;
    const { wallets } = store.getState().wallets;
    if (!wallets) return;
    for (const wallet of Object.values(wallets)) {
      for (const account of (wallet as RainbowWallet).addresses) {
        const hiddenCoins = await getHiddenCoins(account.address, network);
        const pinnedCoins = await getPinnedCoins(account.address, network);

        mmkv.set('pinned-coins-' + account.address, JSON.stringify(pinnedCoins));
        mmkv.set('hidden-coins-' + account.address, JSON.stringify(hiddenCoins));
      }
    }
  };

  migrations.push(v14);

  /*
   *************** Migration v15 ******************
   Ignored
   */
  const v15 = async () => {
    logger.debug('[runMigrations]: Ignoring migration v15');
    return true;
  };

  migrations.push(v15);

  /*
   *************** Migration v16 ******************
   Removes cached Rainbow token list from a cached json file
   in the file system, since we now store fetched from the server files in MMKV now
   */
  const v16 = async () => {
    try {
      RNFS.unlink(path.join(RNFS.CachesDirectoryPath, `${RB_TOKEN_LIST_CACHE}.json`)).catch(() => {
        // we don't care if it fails
      });

      RNFS.unlink(path.join(RNFS.CachesDirectoryPath, `${RB_TOKEN_LIST_ETAG}.json`)).catch(() => {
        // we don't care if it fails
      });
    } catch (error: any) {
      logger.error(new RainbowError(`[runMigrations]: Migration v16 failed: ${error}`));
    }
  };

  migrations.push(v16);

  /*
  *************** Migration v17 ******************
  Pinned coins: list -> obj
  */
  const v17 = async () => {
    const { wallets } = store.getState().wallets;
    if (!wallets) return;
    for (const wallet of Object.values(wallets)) {
      for (const account of (wallet as RainbowWallet).addresses) {
        const pinnedCoins = JSON.parse(mmkv.getString('pinned-coins-' + account.address) ?? '[]');
        const hiddenCoins = JSON.parse(mmkv.getString('hidden-coins-' + account.address) ?? '[]');
        mmkv.set(
          'hidden-coins-obj-' + account.address,
          JSON.stringify(
            hiddenCoins.reduce((acc: BooleanMap, curr: string) => {
              acc[curr] = true;
              return acc;
            }, {} as BooleanMap)
          )
        );

        mmkv.set(
          'pinned-coins-obj-' + account.address,
          JSON.stringify(
            pinnedCoins.reduce((acc: BooleanMap, curr: string) => {
              acc[curr] = true;
              return acc;
            }, {} as BooleanMap)
          )
        );
      }
    }
  };

  migrations.push(v17);

  /**
   *************** Migration v18 ******************
   Move favorites from local storage to react query persistent cache (AsyncStorage)
   */
  const v18 = async () => {
    const favoritesMetadata = await getGlobal('uniswapFavoritesMetadata', undefined, '0.1.0');

    if (favoritesMetadata) {
      const lowercasedFavoritesMetadata: Record<EthereumAddress, RainbowToken> = {};
      Object.keys(favoritesMetadata).forEach((address: string) => {
        lowercasedFavoritesMetadata[address.toLowerCase()] = favoritesMetadata[address];
      });
      queryClient.setQueryData(favoritesQueryKey, lowercasedFavoritesMetadata);
    }
  };

  migrations.push(v18);

  /**
   *************** Migration v19 ******************
   * Deleted migration
   */
  const v19 = async () => {
    return;
  };

  migrations.push(v19);

  /**
   *************** Migration v20 ******************
   * Migrates dapp browser favorites store from createStore to createRainbowStore
   */
  const v20 = async () => {
    const initializeLegacyStore = () => {
      return new Promise<void>(resolve => {
        // Give the async legacy store a moment to initialize
        setTimeout(() => {
          resolve();
        }, 1000);
      });
    };

    await initializeLegacyStore();
    const legacyFavorites = useLegacyFavoriteDappsStore.getState().favoriteDapps;

    if (legacyFavorites.length > 0) {
      // Re-standardize URLs to ensure they're in the correct format
      for (const favorite of legacyFavorites) {
        favorite.url = standardizeUrl(favorite.url);
      }
      useFavoriteDappsStore.setState({ favoriteDapps: legacyFavorites });
      useLegacyFavoriteDappsStore.setState({ favoriteDapps: [] });
    }
  };

  migrations.push(v20);

  /**
   *************** Migration v21 ******************
   * Migrate hidden coins from MMKV to Zustand
   */
  const v21 = async () => {
    const { wallets } = store.getState().wallets;
    if (!wallets) return;

    for (const wallet of Object.values(wallets)) {
      for (const { address } of (wallet as RainbowWallet).addresses) {
        const hiddenCoins = JSON.parse(mmkv.getString('hidden-coins-obj-' + address) ?? '{}');
        if (isEmpty(hiddenCoins)) continue;

        const hiddenAssets = Object.keys(hiddenCoins).reduce<UniqueId[]>((acc: UniqueId[], key) => {
          // we need to run it through this funciton because users could have legacy coins when we had network-based uniqueId
          const { address, chainId } = getAddressAndChainIdFromUniqueId(key);
          const uniqueId = getUniqueId(address, chainId);
          acc.push(uniqueId);
          return acc;
        }, []);

        userAssetsStore.getState(address).setHiddenAssets(hiddenAssets);

        // remove the old hidden coins obj storage
        mmkv.delete('hidden-coins-obj-' + address);
      }
    }
  };

  migrations.push(v21);

  /**
   *************** Migration v22 ******************
   * Reset icon checks
   */
  const v22 = async () => {
    // For each appIcon, delete the handled flag
    (Object.keys(unlockableAppIcons) as UnlockableAppIconKey[]).map(appIconKey => {
      unlockableAppIconStorage.delete(appIconKey);
      logger.debug('Resetting icon status for ' + appIconKey);
    });
  };

  migrations.push(v22);

  /**
   *************** Migration v23 ******************
   * Populate `legacyUserAssets` attribute in `userAssetsStore`
   */
  const v23 = async () => {
    const state = store.getState();
    const { wallets } = state.wallets;
    const { nativeCurrency } = state.settings;

    if (!wallets) return;

    for (const wallet of Object.values(wallets)) {
      for (const { address } of (wallet as RainbowWallet).addresses) {
        const { connectedToAnvil } = useConnectedToAnvilStore.getState();
        const queryKey = userAssetsQueryKey({ address, currency: nativeCurrency, testnetMode: connectedToAnvil });
        const queryData: ParsedAssetsDictByChain | undefined = queryClient.getQueryData(queryKey);

        if (!queryData) continue;

        const userAssets = selectorFilterByUserChains({
          data: queryData,
          selector: selectUserAssetsList,
        });
        userAssetsStore.getState(address).setUserAssets(userAssets as ParsedSearchAsset[]);
      }
    }
  };

  migrations.push(v23);

  /**
   *************** Migration v24 ******************
   * Clear FastImage cache to fix mainnet badge sizing issue
   */
  const v24 = () => {
    try {
      FastImage.clearDiskCache();
    } catch (e) {
      logger.error(new RainbowError(`Error clearing FastImage disk cache: ${e}`));
    }

    try {
      FastImage.clearMemoryCache();
    } catch (e) {
      logger.error(new RainbowError(`Error clearing FastImage memory cache: ${e}`));
    }
  };

  migrations.push(v24);

  logger.debug(`[runMigrations]: ready to run migrations starting on number ${currentVersion}`);
  // await setMigrationVersion(17);
  if (migrations.length === currentVersion) {
    logger.debug(`[runMigrations]: Nothing to run`);
    return;
  }

  for (let i = currentVersion; i < migrations.length; i++) {
    logger.debug(`[runMigrations]: Running migration v${i}`);
    await migrations[i].apply(null);
    logger.debug(`[runMigrations]: Migration ${i} completed succesfully`);
    await setMigrationVersion(i + 1);
  }
}
