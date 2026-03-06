import { isValidAddress } from 'ethereumjs-util';
import * as i18n from '@/languages';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { InteractionManager, Keyboard, type TextInput } from 'react-native';
import { fetchENSAvatar } from './useENSAvatar';
import { initializeWallet } from '../state/wallets/initializeWallet';
import useIsWalletEthZero from './useIsWalletEthZero';
import usePrevious from './usePrevious';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { analytics } from '@/analytics';
import { PROFILES, useExperimentalFlag } from '@/config';
import { fetchReverseRecord } from '@/handlers/ens';
import { getProvider, resolveUnstoppableDomain } from '@/handlers/web3';
import { isENSAddressFormat, isUnstoppableAddressFormat, isValidWallet } from '@/helpers/validators';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { type ImportFlowContext } from '@/navigation/types';
import { sanitizeSeedPhrase } from '@/utils/formatters';
import { deriveAccountFromWalletInput } from '@/utils/wallet';
import { logger, RainbowError } from '@/logger';
import { ChainId } from '@/state/backendNetworks/types';
import { backupsStore } from '@/state/backups/backups';
import { canShowBackupPrompt, showBackupPrompt } from '@/helpers/backupPrompt';
import { walletLoadingStore } from '@/state/walletLoading/walletLoading';
import { WalletLoadingStates } from '@/helpers/walletLoadingStates';
import { IS_ANDROID } from '@/env';
import { getSelectedWallet, useAccountAddress } from '@/state/wallets/walletsStore';
import { navigateAfterOnboarding } from '@/navigation/onboardingNavigation';

export default function useImportingWallet({
  flowContext,
  showImportModal = true,
}: {
  flowContext?: ImportFlowContext;
  showImportModal?: boolean;
} = {}) {
  const accountAddress = useAccountAddress();

  const { navigate, goBack, getParent: dangerouslyGetParent } = useNavigation<typeof Routes.MODAL_SCREEN>();
  const isWalletEthZero = useIsWalletEthZero();
  const [isImporting, setImporting] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState('');
  const [color, setColor] = useState<number | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checkedWallet, setCheckedWallet] = useState<Awaited<ReturnType<typeof deriveAccountFromWalletInput>> | null>(null);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const wasImporting = usePrevious(isImporting);
  const profilesEnabled = useExperimentalFlag(PROFILES);

  const backupProvider = backupsStore(state => state.backupProvider);

  const inputRef = useRef<TextInput>(null);

  const isSecretValid = useMemo(() => {
    return seedPhrase !== accountAddress && isValidWallet(seedPhrase);
  }, [accountAddress, seedPhrase]);

  const resetOnFailure = useCallback(() => {
    setImporting(false);
    setBusy(false);
    walletLoadingStore.setState({ loadingState: null });
    // Return to previous screen on failure
    goBack();
  }, [goBack]);

  const handleSetSeedPhrase = useCallback(
    (text: string) => {
      if (isImporting) return null;
      return setSeedPhrase(text);
    },
    [isImporting]
  );

  const startImportProfile = useCallback(
    (name: string, forceColor: string | number | null | undefined, address: string, avatarUrl: string | null | undefined) => {
      const importWallet = (color: number | null, name: string, image?: string) =>
        InteractionManager.runAfterInteractions(() => {
          if (color !== null) setColor(color);
          if (name) setName(name);
          if (image) setImage(image);
          setImporting(true);
        });

      if (showImportModal) {
        if (IS_ANDROID) {
          Keyboard.dismiss();
        }

        navigate(Routes.MODAL_SCREEN, {
          actionType: 'Import',
          additionalPadding: true,
          address,
          asset: [],
          forceColor: typeof forceColor === 'string' ? forceColor : null,
          isNewProfile: true,
          onCloseModal: ({ color, name, image }) => {
            importWallet(color, name, image);
          },
          profile: { image: avatarUrl ?? undefined, name },
          type: 'wallet_profile',
          withoutStatusBar: true,
        });
      } else {
        importWallet(typeof forceColor === 'number' ? forceColor : null, name, avatarUrl ?? undefined);
      }
    },
    [navigate, showImportModal]
  );

  const handlePressImportButton = useCallback(
    async ({
      forceColor,
      forceAddress = '',
      avatarUrl,
      type = 'import',
    }: {
      forceColor?: string | number;
      forceAddress?: string;
      avatarUrl?: string;
      type?: 'import' | 'watch';
    } = {}) => {
      setBusy(true);

      analytics.track(analytics.event.tappedImportButton);

      if ((!isSecretValid || !seedPhrase) && !forceAddress) {
        return null;
      }

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
            Alert.alert(i18n.t(i18n.l.wallet.invalid_ens_name));
            return;
          }
          setResolvedAddress(address);
          name = input;

          const finalAvatarUrl = avatarUrl || (avatar && avatar?.imageUrl);
          setBusy(false);

          if (type === 'watch') {
            analytics.track(analytics.event.watchWallet, {
              addressOrEnsName: input, // ENS name
              address,
            });
          }

          startImportProfile(name, forceColor, address, finalAvatarUrl || undefined);
          analytics.track(analytics.event.showWalletProfileModalForENSAddress, {
            address,
            input,
          });
        } catch (e) {
          setBusy(false);
          Alert.alert(i18n.t(i18n.l.wallet.sorry_cannot_add_ens));
          return;
        }
        // Look up ENS for 0x address
      } else if (isUnstoppableAddressFormat(input)) {
        try {
          const address = await resolveUnstoppableDomain(input);
          if (!address) {
            setBusy(false);
            Alert.alert(i18n.t(i18n.l.wallet.invalid_unstoppable_name));
            return;
          }
          setResolvedAddress(address);
          name = input;
          setBusy(false);

          if (type === 'watch') {
            analytics.track(analytics.event.watchWallet, {
              addressOrEnsName: input, // unstoppable domain name
              address,
            });
          }

          startImportProfile(name, forceColor, address, '');
          analytics.track(analytics.event.showWalletProfileModalForUnstoppableAddress, {
            address,
            input,
          });
        } catch (e) {
          setBusy(false);
          Alert.alert(i18n.t(i18n.l.wallet.sorry_cannot_add_unstoppable));
          return;
        }
      } else if (isValidAddress(input)) {
        let finalAvatarUrl: string | null | undefined = avatarUrl;
        let ens = input;
        try {
          ens = await fetchReverseRecord(input);
          if (ens && ens !== input) {
            name = ens;
            if (!avatarUrl && profilesEnabled) {
              const avatar = await fetchENSAvatar(name, { swallowError: true });
              finalAvatarUrl = avatar?.imageUrl;
            }
          }

          analytics.track(analytics.event.showWalletProfileModalForReadOnlyWallet, {
            ens,
            input,
          });
        } catch (e) {
          logger.error(new RainbowError(`[useImportingWallet]: Error resolving ENS during wallet import`, e));
        }

        setBusy(false);

        if (type === 'watch') {
          analytics.track(analytics.event.watchWallet, {
            addressOrEnsName: ens,
            address: input,
          });
        }

        startImportProfile(name || '', forceColor, input, finalAvatarUrl);
      } else {
        try {
          const walletResult = await deriveAccountFromWalletInput(input);

          setCheckedWallet(walletResult);

          if (!walletResult.address) {
            logger.error(new RainbowError('[useImportingWallet]: walletResult address is undefined'));
            return null;
          }

          const ens = await fetchReverseRecord(walletResult.address);
          let finalAvatarUrl: string | null | undefined = avatarUrl;
          if (ens && ens !== input) {
            name = ens;
            if (!finalAvatarUrl && profilesEnabled) {
              const avatar = await fetchENSAvatar(name, {
                swallowError: true,
              });
              finalAvatarUrl = avatar?.imageUrl;
            }
          }

          setBusy(false);

          if (type === 'watch') {
            analytics.track(analytics.event.watchWallet, {
              addressOrEnsName: ens,
              address: input,
            });
          }

          startImportProfile(name || '', forceColor, walletResult.address, finalAvatarUrl);

          analytics.track(analytics.event.showWalletProfileModalForImportedWallet, {
            address: walletResult.address,
            type: walletResult.type,
          });
        } catch (error) {
          logger.error(new RainbowError(`[useImportingWallet]: Error looking up ENS for imported HD type wallet`, error));
          setBusy(false);
        }
      }
    },
    [isSecretValid, profilesEnabled, seedPhrase, startImportProfile]
  );

  useEffect(() => {
    if (wasImporting || !isImporting) {
      return;
    }

    const handleImportSuccess = async (isWalletEthZero: boolean, backupProvider: string | undefined) => {
      setImporting(false);
      setBusy(false);
      walletLoadingStore.setState({ loadingState: null });

      const selectedWallet = getSelectedWallet();
      const shouldShowImportBackupPrompt = flowContext === 'in_app' && canShowBackupPrompt(selectedWallet);

      try {
        // Dismiss the ADD_WALLET_NAVIGATOR modal stack
        dangerouslyGetParent?.()?.goBack();

        if (flowContext !== 'in_app') {
          await navigateAfterOnboarding();
        }

        if (shouldShowImportBackupPrompt) {
          InteractionManager.runAfterInteractions(() => {
            showBackupPrompt(backupProvider);
          });
        }
      } catch (error) {
        logger.error(new RainbowError('[useImportingWallet]: Error navigating to wallet screen'), { error });
        try {
          goBack();
        } catch (fallbackError) {
          logger.error(new RainbowError('[useImportingWallet]: Error with fallback navigation'), { fallbackError });
        }
      }

      InteractionManager.runAfterInteractions(() => {
        analytics.track(analytics.event.importedSeedPhrase, {
          isWalletEthZero,
        });
      });
    };

    const performImport = async () => {
      try {
        const input = resolvedAddress ? resolvedAddress : sanitizeSeedPhrase(seedPhrase);

        walletLoadingStore.setState({
          loadingState: WalletLoadingStates.IMPORTING_WALLET,
        });

        const success = await initializeWallet({
          seedPhrase: input,
          color,
          name: name ? name : '',
          checkedWallet,
          image,
          silent: !showImportModal,
        });

        if (success) {
          await handleImportSuccess(isWalletEthZero, backupProvider);
        } else {
          // Import failed
          logger.error(new RainbowError('[useImportingWallet]: Import failed'));
          resetOnFailure();

          // Refocus input for retry
          setTimeout(() => {
            inputRef.current?.focus();
          }, 100);
        }
      } catch (error) {
        logger.error(new RainbowError(`[useImportingWallet]: Error importing wallet: ${error}`));
        resetOnFailure();

        // Refocus input for retry
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
    };

    performImport();
  }, [
    checkedWallet,
    color,
    isWalletEthZero,
    isImporting,
    name,
    resolvedAddress,
    seedPhrase,
    wasImporting,
    image,
    showImportModal,
    profilesEnabled,
    backupProvider,
    flowContext,
    resetOnFailure,
    dangerouslyGetParent,
    goBack,
  ]);

  return {
    busy,
    handlePressImportButton,
    handleSetSeedPhrase,
    inputRef,
    isImporting,
    isSecretValid,
    seedPhrase,
  };
}
