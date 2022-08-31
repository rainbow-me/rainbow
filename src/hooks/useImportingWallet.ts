import { isValidAddress } from 'ethereumjs-util';
import lang from 'i18n-js';
import { keys } from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { InteractionManager, Keyboard } from 'react-native';
// @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
import { IS_TESTING } from 'react-native-dotenv';
import { useDispatch } from 'react-redux';
import useAccountSettings from './useAccountSettings';
import { fetchENSAvatar } from './useENSAvatar';
import useInitializeWallet from './useInitializeWallet';
import useIsWalletEthZero from './useIsWalletEthZero';
import useMagicAutofocus from './useMagicAutofocus';
import usePrevious from './usePrevious';
import useTimeout from './useTimeout';
import useWalletENSAvatar from './useWalletENSAvatar';
import useWallets from './useWallets';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { analytics } from '@/analytics';
import { PROFILES, useExperimentalFlag } from '@/config';
import { fetchReverseRecord } from '@/handlers/ens';
import { fetchRainbowProfile } from '@/handlers/rainbowProfiles';
import { resolveUnstoppableDomain, web3Provider } from '@/handlers/web3';
import {
  isENSAddressFormat,
  isUnstoppableAddressFormat,
  isValidWallet,
} from '@/helpers/validators';
import WalletBackupStepTypes from '@/helpers/walletBackupStepTypes';
import { WalletLoadingStates } from '@/helpers/walletLoadingStates';
import { walletInit } from '@/model/wallet';
import { Navigation, useNavigation } from '@/navigation';
import { walletsLoadState } from '@/redux/wallets';
import Routes from '@/navigation/routesNames';
import { ethereumUtils, sanitizeSeedPhrase } from '@/utils';
import logger from '@/utils/logger';

export default function useImportingWallet({ showImportModal = true } = {}) {
  const { accountAddress } = useAccountSettings();
  const { selectedWallet, setIsWalletLoading, wallets } = useWallets();

  // @ts-expect-error ts-migrate(2339) FIXME: Property 'replace' does not exist on type '{ dispa... Remove this comment to see the full error message
  const { goBack, navigate, replace, setParams } = useNavigation();
  const initializeWallet = useInitializeWallet();
  const isWalletEthZero = useIsWalletEthZero();
  const [isImporting, setImporting] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState('');
  const [emoji, setEmoji] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checkedWallet, setCheckedWallet] = useState(null);
  const [resolvedAddress, setResolvedAddress] = useState(null);
  const [startAnalyticsTimeout] = useTimeout();
  const wasImporting = usePrevious(isImporting);
  const { updateWalletENSAvatars } = useWalletENSAvatar();
  const profilesEnabled = useExperimentalFlag(PROFILES);

  const inputRef = useRef(null);

  useEffect(() => {
    android &&
      setTimeout(() => {
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'focus' does not exist on type 'never'.
        inputRef.current?.focus();
      }, 500);
  }, []);
  // @ts-expect-error ts-migrate(2554) FIXME: Expected 2-4 arguments, but got 1.
  const { handleFocus } = useMagicAutofocus(inputRef);

  const isSecretValid = useMemo(() => {
    return seedPhrase !== accountAddress && isValidWallet(seedPhrase);
  }, [accountAddress, seedPhrase]);

  const handleSetImporting = useCallback(
    newImportingState => {
      setImporting(newImportingState);
      setParams({ gesturesEnabled: !newImportingState });
    },
    [setParams]
  );

  const handleSetSeedPhrase = useCallback(
    text => {
      if (isImporting) return null;
      return setSeedPhrase(text);
    },
    [isImporting]
  );

  const startImportProfile = useCallback(
    async (name, address = null, avatarUrl = null) => {
      const rainbowProfile = await fetchRainbowProfile(address);
      setColor(rainbowProfile?.color);
      setEmoji(rainbowProfile?.emoji);
      const importWallet = (name: any, image: any) =>
        InteractionManager.runAfterInteractions(() => {
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
          isNewProfile: true,
          onCloseModal: ({ name, image }: { name: string; image: string }) => {
            importWallet(name, image);
          },
          profile: {
            color: rainbowProfile?.color,
            emoji: rainbowProfile?.emoji,
            image: avatarUrl,
            name,
          },
          type: 'wallet_profile',
          withoutStatusBar: true,
        });
      } else {
        importWallet(name, avatarUrl);
      }
    },
    [handleSetImporting, navigate, showImportModal]
  );

  const handlePressImportButton = useCallback(
    async (forceAddress, avatarUrl) => {
      analytics.track('Tapped "Import" button');

      if ((!isSecretValid || !seedPhrase) && !forceAddress) return null;
      const input = sanitizeSeedPhrase(seedPhrase || forceAddress);
      let name: string | null = null;
      // Validate ENS
      if (isENSAddressFormat(input)) {
        try {
          const [address, avatar] = await Promise.all([
            web3Provider.resolveName(input),
            !avatarUrl &&
              profilesEnabled &&
              fetchENSAvatar(input, { swallowError: true }),
          ]);

          if (!address) {
            Alert.alert(lang.t('wallet.invalid_ens_name'));
            return;
          }
          // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'string' is not assignable to par... Remove this comment to see the full error message
          setResolvedAddress(address);
          avatarUrl = avatarUrl || avatar?.imageUrl;
          await startImportProfile(input, address, avatarUrl);
          analytics.track('Show wallet profile modal for ENS address', {
            address,
            input,
          });
        } catch (e) {
          Alert.alert(lang.t('wallet.sorry_cannot_add_ens'));
          return;
        }
        // Look up ENS for 0x address
      } else if (isUnstoppableAddressFormat(input)) {
        try {
          const address = await resolveUnstoppableDomain(input);
          if (!address) {
            Alert.alert(lang.t('wallet.invalid_unstoppable_name'));
            return;
          }
          // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'string' is not assignable to par... Remove this comment to see the full error message
          setResolvedAddress(address);
          name = input;
          await startImportProfile(name, address);
          analytics.track('Show wallet profile modal for Unstoppable address', {
            address,
            input,
          });
        } catch (e) {
          Alert.alert(lang.t('wallet.sorry_cannot_add_unstoppable'));
          return;
        }
      } else if (isValidAddress(input)) {
        try {
          const ens = await fetchReverseRecord(input);
          if (ens && ens !== input) {
            name = ens;
            if (!avatarUrl && profilesEnabled) {
              const avatar = await fetchENSAvatar(name, { swallowError: true });
              avatarUrl = avatar?.imageUrl;
            }
          }
          analytics.track('Show wallet profile modal for read only wallet', {
            ens,
            input,
          });
        } catch (e) {
          logger.log(`Error resolving ENS during wallet import`, e);
        }
        await startImportProfile(name, input, avatarUrl);
      } else {
        try {
          setBusy(true);
          setTimeout(async () => {
            const walletResult = await ethereumUtils.deriveAccountFromWalletInput(
              input
            );
            // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ address: string; isHDWallet: b... Remove this comment to see the full error message
            setCheckedWallet(walletResult);

            const ens = await fetchReverseRecord(walletResult.address);
            if (ens && ens !== input) {
              name = ens;
              if (!avatarUrl && profilesEnabled) {
                const avatar = await fetchENSAvatar(name, {
                  swallowError: true,
                });
                avatarUrl = avatar?.imageUrl;
              }
            }
            setBusy(false);
            await startImportProfile(name, walletResult.address, avatarUrl);
            analytics.track('Show wallet profile modal for imported wallet', {
              address: walletResult.address,
              type: walletResult.type,
            });
          }, 100);
        } catch (error) {
          logger.log('Error looking up ENS for imported HD type wallet', error);
          setBusy(false);
        }
      }
    },
    [isSecretValid, profilesEnabled, seedPhrase, startImportProfile]
  );

  const dispatch = useDispatch();

  useEffect(() => {
    if (!wasImporting && isImporting) {
      startAnalyticsTimeout(async () => {
        const input = resolvedAddress
          ? resolvedAddress
          : sanitizeSeedPhrase(seedPhrase);

        if (!showImportModal) {
          await walletInit(
            // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'string | null' is not assignable... Remove this comment to see the full error message
            input,
            name ? name : '',
            false,
            checkedWallet,
            undefined,
            image,
            color,
            emoji,
            true
          );
          await dispatch(walletsLoadState(profilesEnabled));
          handleSetImporting(false);
        } else {
          const previousWalletCount = keys(wallets).length;
          initializeWallet(
            input,
            name ? name : '',
            false,
            false,
            checkedWallet,
            undefined,
            image,
            color,
            emoji
          )
            .then(success => {
              ios && handleSetImporting(false);
              if (success) {
                goBack();
                InteractionManager.runAfterInteractions(async () => {
                  if (previousWalletCount === 0) {
                    // on Android replacing is not working well, so we navigate and then remove the screen below
                    const action = ios ? replace : navigate;
                    action(Routes.SWIPE_LAYOUT, {
                      params: { initialized: true },
                      screen: Routes.WALLET_SCREEN,
                    });
                  } else {
                    navigate(Routes.WALLET_SCREEN, { initialized: true });
                  }
                  if (android) {
                    handleSetImporting(false);
                    InteractionManager.runAfterInteractions(() =>
                      setIsWalletLoading(null)
                    );
                  }

                  setTimeout(() => {
                    // If it's not read only, show the backup sheet
                    if (
                      !(
                        isENSAddressFormat(input) ||
                        isUnstoppableAddressFormat(input) ||
                        isValidAddress(input)
                      )
                    ) {
                      IS_TESTING !== 'true' &&
                        Navigation.handleAction(Routes.BACKUP_SHEET, {
                          single: true,
                          step: WalletBackupStepTypes.imported,
                        });
                    }
                  }, 1000);

                  analytics.track('Imported seed phrase', {
                    isWalletEthZero,
                  });
                });
              } else {
                if (android) {
                  setIsWalletLoading(null);
                  handleSetImporting(false);
                }
                // Wait for error messages then refocus
                setTimeout(() => {
                  // @ts-expect-error ts-migrate(2339) FIXME: Property 'focus' does not exist on type 'never'.
                  inputRef.current?.focus();
                  // @ts-expect-error ts-migrate(2554) FIXME: Expected 8-9 arguments, but got 0.
                  initializeWallet();
                }, 100);
              }
            })
            .catch(error => {
              handleSetImporting(false);
              android && handleSetImporting(false);
              logger.error('error importing seed phrase: ', error);
              setTimeout(() => {
                // @ts-expect-error ts-migrate(2339) FIXME: Property 'focus' does not exist on type 'never'.
                inputRef.current?.focus();
                // @ts-expect-error ts-migrate(2554) FIXME: Expected 8-9 arguments, but got 0.
                initializeWallet();
              }, 100);
            });
        }
      }, 50);
    }
  }, [
    checkedWallet,
    isWalletEthZero,
    handleSetImporting,
    goBack,
    initializeWallet,
    isImporting,
    color,
    emoji,
    name,
    navigate,
    replace,
    resolvedAddress,
    seedPhrase,
    selectedWallet.id,
    selectedWallet.type,
    startAnalyticsTimeout,
    wallets,
    wasImporting,
    updateWalletENSAvatars,
    image,
    dispatch,
    showImportModal,
    profilesEnabled,
    setIsWalletLoading,
  ]);

  useEffect(() => {
    setIsWalletLoading(
      isImporting
        ? showImportModal
          ? WalletLoadingStates.IMPORTING_WALLET
          : WalletLoadingStates.IMPORTING_WALLET_SILENTLY
        : null
    );
  }, [isImporting, setIsWalletLoading, showImportModal]);

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
