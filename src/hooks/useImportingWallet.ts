import analytics from '@segment/analytics-react-native';
import { isValidAddress } from 'ethereumjs-util';
import { keys } from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, InteractionManager, Keyboard } from 'react-native';
// @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
import { IS_TESTING } from 'react-native-dotenv';
import useAccountSettings from './useAccountSettings';
import useInitializeWallet from './useInitializeWallet';
import useIsWalletEthZero from './useIsWalletEthZero';
import useMagicAutofocus from './useMagicAutofocus';
import usePrevious from './usePrevious';
import useTimeout from './useTimeout';
import useWallets from './useWallets';
import {
  resolveUnstoppableDomain,
  web3Provider,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/web3' or ... Remove this comment to see the full error message
} from '@rainbow-me/handlers/web3';
import {
  isENSAddressFormat,
  isUnstoppableAddressFormat,
  isValidWallet,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/validators... Remove this comment to see the full error message
} from '@rainbow-me/helpers/validators';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/walletBack... Remove this comment to see the full error message
import WalletBackupStepTypes from '@rainbow-me/helpers/walletBackupStepTypes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/walletLoad... Remove this comment to see the full error message
import walletLoadingStates from '@rainbow-me/helpers/walletLoadingStates';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { Navigation, useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { ethereumUtils, sanitizeSeedPhrase } from '@rainbow-me/utils';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'logger' or its corresponding t... Remove this comment to see the full error message
import logger from 'logger';

export default function useImportingWallet() {
  const { accountAddress } = useAccountSettings();
  const { selectedWallet, setIsWalletLoading, wallets } = useWallets();

  const { goBack, navigate, replace, setParams } = useNavigation();
  const initializeWallet = useInitializeWallet();
  const isWalletEthZero = useIsWalletEthZero();
  const [isImporting, setImporting] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState('');
  const [color, setColor] = useState(null);
  const [name, setName] = useState(null);
  const [busy, setBusy] = useState(false);
  const [checkedWallet, setCheckedWallet] = useState(null);
  const [resolvedAddress, setResolvedAddress] = useState(null);
  const [startAnalyticsTimeout] = useTimeout();
  const wasImporting = usePrevious(isImporting);

  const inputRef = useRef(null);

  useEffect(() => {
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    android &&
      setTimeout(() => {
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'focus' does not exist on type 'never'.
        inputRef.current?.focus();
      }, 500);
  }, []);
  // @ts-expect-error ts-migrate(2554) FIXME: Expected 2-3 arguments, but got 1.
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

  const showWalletProfileModal = useCallback(
    (name, forceColor, address = null) => {
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
      android && Keyboard.dismiss();
      navigate(Routes.MODAL_SCREEN, {
        actionType: 'Import',
        additionalPadding: true,
        address,
        asset: [],
        forceColor,
        isNewProfile: true,
        onCloseModal: ({ color, name }: any) => {
          if (color !== null) setColor(color);
          if (name) setName(name);
          handleSetImporting(true);
        },
        profile: { name },
        type: 'wallet_profile',
        withoutStatusBar: true,
      });
    },
    [handleSetImporting, navigate]
  );

  const handlePressImportButton = useCallback(
    async (forceColor, forceAddress, forceEmoji = null) => {
      analytics.track('Tapped "Import" button');
      // guard against pressEvent coming in as forceColor if
      // handlePressImportButton is used as onClick handler
      let guardedForceColor =
        typeof forceColor === 'string' || typeof forceColor === 'number'
          ? forceColor
          : null;
      if ((!isSecretValid || !seedPhrase) && !forceAddress) return null;
      const input = sanitizeSeedPhrase(seedPhrase || forceAddress);
      let name: any = null;
      // Validate ENS
      if (isENSAddressFormat(input)) {
        try {
          const address = await web3Provider.resolveName(input);
          if (!address) {
            Alert.alert('This is not a valid ENS name');
            return;
          }
          setResolvedAddress(address);
          name = forceEmoji ? `${forceEmoji} ${input}` : input;
          showWalletProfileModal(name, guardedForceColor, address);
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
          name = forceEmoji ? `${forceEmoji} ${input}` : input;
          showWalletProfileModal(name, guardedForceColor, address);
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
        try {
          const ens = await web3Provider.lookupAddress(input);
          if (ens && ens !== input) {
            name = forceEmoji ? `${forceEmoji} ${ens}` : ens;
          }
          analytics.track('Show wallet profile modal for read only wallet', {
            ens,
            input,
          });
        } catch (e) {
          logger.log(`Error resolving ENS during wallet import`, e);
        }
        showWalletProfileModal(name, guardedForceColor, input);
      } else {
        try {
          setBusy(true);
          setTimeout(async () => {
            const walletResult = await ethereumUtils.deriveAccountFromWalletInput(
              input
            );
            setCheckedWallet(walletResult);
            const ens = await web3Provider.lookupAddress(walletResult.address);
            if (ens && ens !== input) {
              name = forceEmoji ? `${forceEmoji} ${ens}` : ens;
            }
            setBusy(false);
            showWalletProfileModal(
              name,
              guardedForceColor,
              walletResult.address
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
    [isSecretValid, seedPhrase, showWalletProfileModal]
  );

  useEffect(() => {
    if (!wasImporting && isImporting) {
      // @ts-expect-error ts-migrate(2349) FIXME: This expression is not callable.
      startAnalyticsTimeout(async () => {
        const input = resolvedAddress
          ? resolvedAddress
          : sanitizeSeedPhrase(seedPhrase);

        const previousWalletCount = keys(wallets).length;
        // @ts-expect-error ts-migrate(2554) FIXME: Expected 7 arguments, but got 6.
        initializeWallet(
          input,
          color,
          name ? name : '',
          false,
          false,
          checkedWallet
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
                // @ts-expect-error ts-migrate(2339) FIXME: Property 'focus' does not exist on type 'never'.
                inputRef.current?.focus();
                // @ts-expect-error ts-migrate(2554) FIXME: Expected 7 arguments, but got 0.
                initializeWallet();
              }, 100);
            }
          })
          .catch(error => {
            handleSetImporting(false);
            logger.error('error importing seed phrase: ', error);
            setTimeout(() => {
              // @ts-expect-error ts-migrate(2339) FIXME: Property 'focus' does not exist on type 'never'.
              inputRef.current?.focus();
              // @ts-expect-error ts-migrate(2554) FIXME: Expected 7 arguments, but got 0.
              initializeWallet();
            }, 100);
          });
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
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'id' does not exist on type '{}'.
    selectedWallet.id,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'type' does not exist on type '{}'.
    selectedWallet.type,
    startAnalyticsTimeout,
    wallets,
    wasImporting,
  ]);

  useEffect(() => {
    setIsWalletLoading(
      isImporting ? walletLoadingStates.IMPORTING_WALLET : null
    );
  }, [isImporting, setIsWalletLoading]);

  return {
    busy,
    handleFocus,
    handlePressImportButton,
    handleSetSeedPhrase,
    inputRef,
    isSecretValid,
    seedPhrase,
  };
}
