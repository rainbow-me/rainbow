import { isValidAddress } from 'ethereumjs-util';
import lang from 'i18n-js';
import { keys } from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { InteractionManager, Keyboard, TextInput } from 'react-native';
import { useDispatch } from 'react-redux';
import useAccountSettings from './useAccountSettings';
import { fetchENSAvatar } from './useENSAvatar';
import useInitializeWallet from './useInitializeWallet';
import useIsWalletEthZero from './useIsWalletEthZero';
import useMagicAutofocus from './useMagicAutofocus';
import usePrevious from './usePrevious';
import useWalletENSAvatar from './useWalletENSAvatar';
import useWallets from './useWallets';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { analytics, analyticsV2 } from '@/analytics';
import { PROFILES, useExperimentalFlag } from '@/config';
import { fetchReverseRecord } from '@/handlers/ens';
import { getProvider, isValidBluetoothDeviceId, resolveUnstoppableDomain } from '@/handlers/web3';
import { isENSAddressFormat, isUnstoppableAddressFormat, isValidWallet } from '@/helpers/validators';
import { walletInit } from '@/model/wallet';
import { Navigation, useNavigation } from '@/navigation';
import { walletsLoadState } from '@/redux/wallets';
import Routes from '@/navigation/routesNames';
import { sanitizeSeedPhrase } from '@/utils';
import { deriveAccountFromWalletInput } from '@/utils/wallet';
import { logger, RainbowError } from '@/logger';
import { handleReviewPromptAction } from '@/utils/reviewAlert';
import { ReviewPromptAction } from '@/storage/schema';
import { ChainId } from '@/state/backendNetworks/types';
import { backupsStore } from '@/state/backups/backups';
import { walletLoadingStore } from '@/state/walletLoading/walletLoading';
import { WalletLoadingStates } from '@/helpers/walletLoadingStates';
import { IS_TEST } from '@/env';
import walletBackupTypes from '@/helpers/walletBackupTypes';
import WalletBackupStepTypes from '@/helpers/walletBackupStepTypes';

export default function useImportingWallet({ showImportModal = true } = {}) {
  const { accountAddress } = useAccountSettings();
  const { selectedWallet, wallets } = useWallets();

  const { getParent: dangerouslyGetParent, navigate, replace, setParams } = useNavigation();
  const initializeWallet = useInitializeWallet();
  const isWalletEthZero = useIsWalletEthZero();
  const [isImporting, setImporting] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState('');
  const [color, setColor] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checkedWallet, setCheckedWallet] = useState<Awaited<ReturnType<typeof deriveAccountFromWalletInput>> | null>(null);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const wasImporting = usePrevious(isImporting);
  const { updateWalletENSAvatars } = useWalletENSAvatar();
  const profilesEnabled = useExperimentalFlag(PROFILES);

  const { backupProvider } = backupsStore(state => ({
    backupProvider: state.backupProvider,
  }));

  const inputRef = useRef<TextInput>(null);

  const { handleFocus } = useMagicAutofocus(inputRef);

  const isSecretValid = useMemo(() => {
    return seedPhrase !== accountAddress && isValidWallet(seedPhrase);
  }, [accountAddress, seedPhrase]);

  const handleSetImporting = useCallback(
    (newImportingState: boolean) => {
      setImporting(newImportingState);
      setParams({ gesturesEnabled: !newImportingState });
    },
    [setParams]
  );

  const handleSetSeedPhrase = useCallback(
    (text: string) => {
      if (isImporting) return null;
      return setSeedPhrase(text.trim());
    },
    [isImporting]
  );

  const startImportProfile = useCallback(
    (name: any, forceColor: any, address: any = null, avatarUrl: any) => {
      const importWallet = (color: string, name: string, image: string) =>
        InteractionManager.runAfterInteractions(() => {
          if (color !== null) setColor(color);
          if (name) setName(name);
          if (image) setImage(image);
          handleSetImporting(true);
        });

      if (showImportModal) {
        android && Keyboard.dismiss();
        navigate(Routes.MODAL_SCREEN, {
          actionType: 'Import',
          additionalPadding: true,
          address,
          asset: [],
          forceColor,
          isNewProfile: true,
          onCloseModal: ({ color, name, image }: { color: string; name: string; image: string }) => {
            importWallet(color, name, image);
          },
          profile: { image: avatarUrl, name },
          type: 'wallet_profile',
          withoutStatusBar: true,
        });
      } else {
        importWallet(forceColor, name, avatarUrl);
      }
    },
    [handleSetImporting, navigate, showImportModal]
  );

  const handlePressImportButton = useCallback(
    async ({
      forceColor,
      forceAddress = '',
      forceEmoji,
      avatarUrl,
      type = 'import',
    }: {
      forceColor?: string | number;
      forceAddress?: string;
      forceEmoji?: string;
      avatarUrl?: string;
      type?: 'import' | 'watch';
    } = {}) => {
      setBusy(true);
      analytics.track('Tapped "Import" button');
      // guard against pressEvent coming in as forceColor if
      // handlePressImportButton is used as onClick handler
      const guardedForceColor = typeof forceColor === 'string' || typeof forceColor === 'number' ? forceColor : null;
      if ((!isSecretValid || !seedPhrase) && !forceAddress) return null;
      setBusy(true);
      const input = sanitizeSeedPhrase(seedPhrase || forceAddress);
      let name: string | null = null;
      // Validate ENS
      if (isENSAddressFormat(input)) {
        try {
          const provider = getProvider({ chainId: ChainId.mainnet });
          const [address, avatar] = await Promise.all([
            provider.resolveName(input),
            !avatarUrl && profilesEnabled && fetchENSAvatar(input, { swallowError: true }),
          ]);
          if (!address) {
            setBusy(false);
            Alert.alert(lang.t('wallet.invalid_ens_name'));
            return;
          }
          setResolvedAddress(address);
          name = forceEmoji ? `${forceEmoji} ${input}` : input;
          const finalAvatarUrl = avatarUrl || (avatar && avatar?.imageUrl);
          setBusy(false);

          if (type === 'watch') {
            analyticsV2.track(analyticsV2.event.watchWallet, {
              addressOrEnsName: input, // ENS name
              address,
            });
          }

          startImportProfile(name, guardedForceColor, address, finalAvatarUrl);
          analytics.track('Show wallet profile modal for ENS address', {
            address,
            input,
          });
        } catch (e) {
          setBusy(false);
          Alert.alert(lang.t('wallet.sorry_cannot_add_ens'));
          return;
        }
        // Look up ENS for 0x address
      } else if (isUnstoppableAddressFormat(input)) {
        try {
          const address = await resolveUnstoppableDomain(input);
          if (!address) {
            setBusy(false);
            Alert.alert(lang.t('wallet.invalid_unstoppable_name'));
            return;
          }
          setResolvedAddress(address);
          name = forceEmoji ? `${forceEmoji} ${input}` : input;
          setBusy(false);

          if (type === 'watch') {
            analyticsV2.track(analyticsV2.event.watchWallet, {
              addressOrEnsName: input, // unstoppable domain name
              address,
            });
          }

          // @ts-expect-error ts-migrate(2554) FIXME: Expected 4 arguments, but got 3.
          startImportProfile(name, guardedForceColor, address);
          analytics.track('Show wallet profile modal for Unstoppable address', {
            address,
            input,
          });
        } catch (e) {
          setBusy(false);
          Alert.alert(lang.t('wallet.sorry_cannot_add_unstoppable'));
          return;
        }
      } else if (isValidAddress(input)) {
        let finalAvatarUrl: string | null | undefined = avatarUrl;
        let ens = input;
        try {
          ens = await fetchReverseRecord(input);
          if (ens && ens !== input) {
            name = forceEmoji ? `${forceEmoji} ${ens}` : ens;
            if (!avatarUrl && profilesEnabled) {
              const avatar = await fetchENSAvatar(name, { swallowError: true });
              finalAvatarUrl = avatar?.imageUrl;
            }
          }

          analytics.track('Show wallet profile modal for read only wallet', {
            ens,
            input,
          });
        } catch (e) {
          logger.error(new RainbowError(`[useImportingWallet]: Error resolving ENS during wallet import: ${e}`));
        }
        setBusy(false);

        if (type === 'watch') {
          analyticsV2.track(analyticsV2.event.watchWallet, {
            addressOrEnsName: ens,
            address: input,
          });
        }

        startImportProfile(name, guardedForceColor, input, finalAvatarUrl);
      } else {
        try {
          setTimeout(async () => {
            const walletResult = await deriveAccountFromWalletInput(input);
            setCheckedWallet(walletResult);
            if (!walletResult.address) {
              logger.error(new RainbowError('[useImportingWallet]: walletResult address is undefined'));
              return null;
            }
            const ens = await fetchReverseRecord(walletResult.address);
            let finalAvatarUrl: string | null | undefined = avatarUrl;
            if (ens && ens !== input) {
              name = forceEmoji ? `${forceEmoji} ${ens}` : ens;
              if (!finalAvatarUrl && profilesEnabled) {
                const avatar = await fetchENSAvatar(name, {
                  swallowError: true,
                });
                finalAvatarUrl = avatar?.imageUrl;
              }
            }
            setBusy(false);

            if (type === 'watch') {
              analyticsV2.track(analyticsV2.event.watchWallet, {
                addressOrEnsName: ens,
                address: input,
              });
            }

            startImportProfile(name, guardedForceColor, walletResult.address, finalAvatarUrl);
            analytics.track('Show wallet profile modal for imported wallet', {
              address: walletResult.address,
              type: walletResult.type,
            });
          }, 100);
        } catch (error) {
          logger.error(new RainbowError(`[useImportingWallet]: Error looking up ENS for imported HD type wallet: ${error}`));
          setBusy(false);
        }
      }
    },
    [isSecretValid, profilesEnabled, seedPhrase, startImportProfile]
  );

  const dispatch = useDispatch();

  useEffect(() => {
    if (!wasImporting && isImporting) {
      const asyncFn = async () => {
        const input = resolvedAddress ? resolvedAddress : sanitizeSeedPhrase(seedPhrase);
        walletLoadingStore.setState({
          loadingState: WalletLoadingStates.IMPORTING_WALLET,
        });

        if (!showImportModal) {
          await walletInit(
            // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'string | null' is not assignable... Remove this comment to see the full error message
            input,
            color,
            name ? name : '',
            false,
            checkedWallet,
            undefined,
            image,
            true
          );
          await dispatch(walletsLoadState());
          handleSetImporting(false);
        } else {
          const previousWalletCount = keys(wallets).length;
          initializeWallet(
            input,
            // @ts-expect-error Initialize wallet is not typed properly now, will be fixed with a refactoring. TODO: remove comment when changing intializeWallet
            color,
            name ? name : '',
            false,
            false,
            checkedWallet,
            undefined,
            image
          )
            .then(success => {
              ios && handleSetImporting(false);
              if (success) {
                InteractionManager.runAfterInteractions(async () => {
                  Navigation.handleAction(
                    Routes.SWIPE_LAYOUT,
                    {
                      screen: Routes.WALLET_SCREEN,
                      params: { initialized: true },
                    },
                    previousWalletCount === 0
                  );

                  if (android) {
                    handleSetImporting(false);
                  }

                  if (
                    backupProvider === walletBackupTypes.cloud &&
                    !(
                      IS_TEST ||
                      isENSAddressFormat(input) ||
                      isUnstoppableAddressFormat(input) ||
                      isValidAddress(input) ||
                      isValidBluetoothDeviceId(input)
                    )
                  ) {
                    Navigation.handleAction(Routes.BACKUP_SHEET, {
                      step: WalletBackupStepTypes.backup_prompt_cloud,
                    });
                  }

                  setTimeout(() => {
                    InteractionManager.runAfterInteractions(() => {
                      handleReviewPromptAction(ReviewPromptAction.WatchWallet);
                    });
                  }, 1_000);

                  analytics.track('Imported seed phrase', {
                    isWalletEthZero,
                  });

                  walletLoadingStore.setState({
                    loadingState: null,
                  });
                  dangerouslyGetParent?.()?.goBack();
                });
              } else {
                if (android) {
                  handleSetImporting(false);
                }
                // Wait for error messages then refocus
                setTimeout(() => {
                  inputRef.current?.focus();
                  // @ts-expect-error ts-migrate(2554) FIXME: Expected 8-9 arguments, but got 0.
                  initializeWallet();
                }, 100);
              }
            })
            .catch(error => {
              handleSetImporting(false);
              android && handleSetImporting(false);
              logger.error(new RainbowError(`[useImportingWallet]: Error importing seed phrase: ${error}`));
              setTimeout(() => {
                inputRef.current?.focus();
                // @ts-expect-error ts-migrate(2554) FIXME: Expected 8-9 arguments, but got 0.
                initializeWallet();
              }, 100);
            });
        }
      };
      asyncFn();
    }
  }, [
    checkedWallet,
    color,
    isWalletEthZero,
    handleSetImporting,
    initializeWallet,
    isImporting,
    name,
    navigate,
    replace,
    resolvedAddress,
    seedPhrase,
    selectedWallet.id,
    selectedWallet.type,
    wallets,
    wasImporting,
    updateWalletENSAvatars,
    image,
    dispatch,
    showImportModal,
    profilesEnabled,
    dangerouslyGetParent,
    backupProvider,
  ]);

  return {
    busy,
    handleFocus,
    handlePressImportButton,
    handleSetSeedPhrase,
    inputRef,
    isImporting,
    isSecretValid,
    seedPhrase,
  };
}
