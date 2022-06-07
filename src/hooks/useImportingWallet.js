import analytics from '@segment/analytics-react-native';
import { isValidAddress } from 'ethereumjs-util';
import { keys } from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, InteractionManager, Keyboard } from 'react-native';
import { IS_TESTING } from 'react-native-dotenv';
import { useDispatch } from 'react-redux';
import {
  useAccountSettings,
  useInitializeWallet,
  useIsWalletEthZero,
  useMagicAutofocus,
  usePrevious,
  useTimeout,
  useWalletENSAvatar,
  useWalletProfile,
  useWallets,
} from '.';
import { PROFILES, useExperimentalFlag } from '@rainbow-me/config';
import { fetchImages, fetchReverseRecord } from '@rainbow-me/handlers/ens';
import {
  resolveUnstoppableDomain,
  web3Provider,
} from '@rainbow-me/handlers/web3';
import {
  isENSAddressFormat,
  isUnstoppableAddressFormat,
  isValidWallet,
} from '@rainbow-me/helpers/validators';
import WalletBackupStepTypes from '@rainbow-me/helpers/walletBackupStepTypes';
import walletLoadingStates from '@rainbow-me/helpers/walletLoadingStates';
import { walletInit } from '@rainbow-me/model/wallet';
import { Navigation, useNavigation } from '@rainbow-me/navigation';
import { walletsLoadState } from '@rainbow-me/redux/wallets';
import Routes from '@rainbow-me/routes';
import { colors } from '@rainbow-me/styles';
import { ethereumUtils, sanitizeSeedPhrase } from '@rainbow-me/utils';
import logger from 'logger';

const TIMEOUT_THRESHOLD_MS = 500;

export default function useImportingWallet({ showImportModal = true } = {}) {
  const { accountAddress } = useAccountSettings();
  const { selectedWallet, setIsWalletLoading, wallets } = useWallets();

  const { goBack, navigate, replace, setParams } = useNavigation();
  const initializeWallet = useInitializeWallet();
  const isWalletEthZero = useIsWalletEthZero();
  const [isImporting, setImporting] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState('');
  const [color, setColor] = useState(null);
  const [name, setName] = useState(null);
  const [image, setImage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [checkedWallet, setCheckedWallet] = useState(null);
  const [resolvedAddress, setResolvedAddress] = useState(null);
  const [startAnalyticsTimeout] = useTimeout();
  const wasImporting = usePrevious(isImporting);
  const { updateWalletENSAvatars } = useWalletENSAvatar();
  const profilesEnabled = useExperimentalFlag(PROFILES);
  const { fetchWalletProfileMeta } = useWalletProfile();

  const inputRef = useRef(null);

  useEffect(() => {
    android &&
      setTimeout(() => {
        inputRef.current?.focus();
      }, 500);
  }, []);
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
    (name, color, emoji, address = null, avatarUrl) => {
      const importWallet = (color, name, image) =>
        InteractionManager.runAfterInteractions(() => {
          if (color) setColor(colors.avatarBackgrounds.indexOf(color));
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
          onCloseModal: ({ color, name, image }) => {
            importWallet(color, name, image);
          },
          profile: { color, emoji, image: avatarUrl, name },
          type: 'wallet_profile',
          withoutStatusBar: true,
        });
      } else {
        importWallet(color, name, avatarUrl);
      }
    },
    [handleSetImporting, navigate, showImportModal]
  );

  const fetchWalletProfileMetaWithTimeout = useCallback(
    async (address, forceColor) =>
      Promise.race([
        fetchWalletProfileMeta(address, forceColor),
        new Promise(resolve => {
          setTimeout(resolve, TIMEOUT_THRESHOLD_MS, {
            color: null,
            emoji: null,
          });
        }),
      ]),
    [fetchWalletProfileMeta]
  );

  const handlePressImportButton = useCallback(
    async (forceColor, forceAddress, forceEmoji = null, avatarUrl) => {
      analytics.track('Tapped "Import" button');
      // guard against pressEvent coming in as forceColor if
      // handlePressImportButton is used as onClick handler
      const guardedForceColor =
        typeof forceColor === 'string'
          ? forceColor
          : typeof forceColor === 'number' &&
            forceColor < colors.avatarBackgrounds.length
          ? colors.avatarBackgrounds[forceColor]
          : null;

      if ((!isSecretValid || !seedPhrase) && !forceAddress) return null;
      const input = sanitizeSeedPhrase(seedPhrase || forceAddress);
      let name = null;

      // Validate ENS
      if (isENSAddressFormat(input)) {
        try {
          const [address, images] = await Promise.all([
            web3Provider.resolveName(input),
            !avatarUrl && profilesEnabled && fetchImages(input),
          ]);
          if (!address) {
            Alert.alert('This is not a valid ENS name');
            return;
          }
          setResolvedAddress(address);
          name = forceEmoji ? `${forceEmoji} ${input}` : input;
          avatarUrl = avatarUrl || images?.avatarUrl;

          // fetch web profile
          const { color, emoji } = await fetchWalletProfileMetaWithTimeout(
            address,
            guardedForceColor
          );

          startImportProfile(name, color, emoji, address, avatarUrl);
          analytics.track('Show wallet profile modal for ENS address', {
            address,
            input,
          });
        } catch (e) {
          Alert.alert(
            'Sorry, we cannot add this ENS name at this time. Please try again later!'
          );
          return;
        }
        // Look up ENS for 0x address
      } else if (isUnstoppableAddressFormat(input)) {
        try {
          const address = await resolveUnstoppableDomain(input);
          if (!address) {
            Alert.alert('This is not a valid Unstoppable name');
            return;
          }
          setResolvedAddress(address);

          // fetch web profile
          const { color, emoji } = await fetchWalletProfileMetaWithTimeout(
            address,
            guardedForceColor
          );

          name = forceEmoji ? `${forceEmoji} ${input}` : input;
          startImportProfile(name, color, emoji, address);
          analytics.track('Show wallet profile modal for Unstoppable address', {
            address,
            input,
          });
        } catch (e) {
          Alert.alert(
            'Sorry, we cannot add this Unstoppable name at this time. Please try again later!'
          );
          return;
        }
      } else if (isValidAddress(input)) {
        // fetch web profile
        const { color, emoji } = await fetchWalletProfileMetaWithTimeout(
          input,
          guardedForceColor
        );
        try {
          const ens = await web3Provider.lookupAddress(input);
          if (ens && ens !== input) {
            name = forceEmoji ? `${forceEmoji} ${ens}` : ens;
            if (!avatarUrl && profilesEnabled) {
              const images = await fetchImages(name);
              avatarUrl = images?.avatarUrl;
            }
          }
          analytics.track('Show wallet profile modal for read only wallet', {
            ens,
            input,
          });
        } catch (e) {
          logger.log(`Error resolving ENS during wallet import`, e);
        }
        startImportProfile(name, color, emoji, input);
      } else {
        try {
          setBusy(true);
          setTimeout(async () => {
            const walletResult = await ethereumUtils.deriveAccountFromWalletInput(
              input
            );
            setCheckedWallet(walletResult);

            // fetch web profile
            const { color, emoji } = await fetchWalletProfileMetaWithTimeout(
              walletResult.address,
              guardedForceColor
            );

            const ens = await fetchReverseRecord(walletResult.address);
            if (ens && ens !== input) {
              name = forceEmoji ? `${forceEmoji} ${ens}` : ens;
              if (!avatarUrl && profilesEnabled) {
                const images = await fetchImages(name);
                avatarUrl = images?.avatarUrl;
              }
            }
            setBusy(false);
            startImportProfile(
              name,
              color,
              emoji,
              walletResult.address,
              avatarUrl
            );
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
    [
      fetchWalletProfileMetaWithTimeout,
      isSecretValid,
      profilesEnabled,
      seedPhrase,
      startImportProfile,
    ]
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
            input,
            color,
            name ? name : '',
            false,
            checkedWallet,
            undefined,
            image,
            true
          );
          await dispatch(walletsLoadState(profilesEnabled));
          handleSetImporting(false);
        } else {
          const previousWalletCount = keys(wallets).length;
          initializeWallet(
            input,
            color,
            name ? name : '',
            false,
            false,
            checkedWallet,
            undefined,
            image
          )
            .then(success => {
              handleSetImporting(false);
              if (success) {
                goBack();
                InteractionManager.runAfterInteractions(async () => {
                  if (previousWalletCount === 0) {
                    replace(Routes.SWIPE_LAYOUT, {
                      params: { initialized: true },
                      screen: Routes.WALLET_SCREEN,
                    });
                  } else {
                    navigate(Routes.WALLET_SCREEN, { initialized: true });
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
                // Wait for error messages then refocus
                setTimeout(() => {
                  inputRef.current?.focus();
                  initializeWallet();
                }, 100);
              }
            })
            .catch(error => {
              handleSetImporting(false);
              logger.error('error importing seed phrase: ', error);
              setTimeout(() => {
                inputRef.current?.focus();
                initializeWallet();
              }, 100);
            });
        }
      }, 50);
    }
  }, [
    checkedWallet,
    color,
    isWalletEthZero,
    handleSetImporting,
    goBack,
    initializeWallet,
    isImporting,
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
  ]);

  useEffect(() => {
    setIsWalletLoading(
      isImporting
        ? showImportModal
          ? walletLoadingStates.IMPORTING_WALLET
          : walletLoadingStates.IMPORTING_WALLET_SILENTLY
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
