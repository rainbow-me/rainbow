import analytics from '@segment/analytics-react-native';
import { isValidAddress } from 'ethereumjs-util';
import { keys } from 'lodash';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, InteractionManager, StatusBar } from 'react-native';
import { IS_TESTING } from 'react-native-dotenv';
import { KeyboardArea } from 'react-native-keyboard-area';
import styled from 'styled-components/primitives';
import ActivityIndicator from '../components/ActivityIndicator';
import Spinner from '../components/Spinner';
import { MiniButton } from '../components/buttons';
import { Input } from '../components/inputs';
import { Centered, Column, Row } from '../components/layout';
import { SheetHandle } from '../components/sheet';
import { Text } from '../components/text';
import {
  InvalidPasteToast,
  ToastPositionContainer,
} from '../components/toasts';
import { web3Provider } from '@rainbow-me/handlers/web3';
import isNativeStackAvailable from '@rainbow-me/helpers/isNativeStackAvailable';
import {
  isENSAddressFormat,
  isValidWallet,
} from '@rainbow-me/helpers/validators';
import WalletBackupStepTypes from '@rainbow-me/helpers/walletBackupStepTypes';
import walletLoadingStates from '@rainbow-me/helpers/walletLoadingStates';
import {
  useAccountSettings,
  useClipboard,
  useDimensions,
  useInitializeWallet,
  useInvalidPaste,
  useIsWalletEthZero,
  useKeyboardHeight,
  useMagicAutofocus,
  usePrevious,
  useTimeout,
  useWallets,
} from '@rainbow-me/hooks';
import { Navigation, useNavigation } from '@rainbow-me/navigation';
import { sheetVerticalOffset } from '@rainbow-me/navigation/effects';
import Routes from '@rainbow-me/routes';
import { borders, colors, padding } from '@rainbow-me/styles';
import {
  deviceUtils,
  ethereumUtils,
  sanitizeSeedPhrase,
} from '@rainbow-me/utils';
import logger from 'logger';

const sheetBottomPadding = 19;

const Container = styled.View`
  flex: 1;
  padding-top: ${android
    ? 0
    : isNativeStackAvailable
    ? 0
    : sheetVerticalOffset};
  ${android ? `margin-top: ${sheetVerticalOffset};` : ''}
  ${android ? `background-color: ${colors.transparent};` : ''}
`;

const Footer = styled(Row).attrs({
  align: 'start',
  justify: 'end',
})`
  bottom: ${android ? 15 : 0};
  position: ${android ? 'absolute' : 'relative'};
  right: 0;
  width: 100%;
  ${android
    ? `top: ${({ isSmallPhone }) =>
        isSmallPhone ? sheetBottomPadding * 2 : 0};`
    : ``}
  ${android ? 'margin-right: 18;' : ''}
`;

const LoadingSpinner = styled(android ? Spinner : ActivityIndicator).attrs({
  color: 'white',
  size: 15,
})`
  margin-right: 5;
  margin-top: ${android ? 0 : 2};
`;

const FooterButton = styled(MiniButton).attrs({
  testID: 'import-sheet-button',
})``;

const KeyboardSizeView = styled(KeyboardArea)`
  background-color: ${colors.white};
`;

const SecretTextArea = styled(Input).attrs({
  align: 'center',
  autoCapitalize: 'none',
  autoCorrect: false,
  autoFocus: true,
  enablesReturnKeyAutomatically: true,
  keyboardType: android ? 'visible-password' : 'default',
  lineHeight: 'looser',
  multiline: true,
  numberOfLines: 3,
  placeholder: 'Seed phrase, private key, Ethereum address or ENS name',
  returnKeyType: 'done',
  size: 'large',
  spellCheck: false,
  weight: 'semibold',
})`
  margin-bottom: ${android ? 55 : 0};
  min-height: ${android ? 100 : 50};
  width: 100%;
`;

const SecretTextAreaContainer = styled(Centered)`
  ${padding(0, 42)};
  flex: 1;
`;

const Sheet = styled(Column).attrs({
  align: 'center',
  flex: 1,
})`
  ${borders.buildRadius('top', isNativeStackAvailable ? 0 : 16)};
  ${padding(0, 15, sheetBottomPadding)};
  background-color: ${colors.white};
  z-index: 1;
`;

export default function ImportSeedPhraseSheet() {
  const { accountAddress } = useAccountSettings();
  const { selectedWallet, setIsWalletLoading, wallets } = useWallets();
  const { getClipboard, hasClipboardData, clipboard } = useClipboard();
  const { onInvalidPaste } = useInvalidPaste();
  const { isSmallPhone } = useDimensions();
  const keyboardHeight = useKeyboardHeight();
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
    android &&
      setTimeout(() => {
        inputRef.current?.focus();
      }, 500);
  }, []);
  const { handleFocus } = useMagicAutofocus(inputRef);

  const isClipboardValidSecret = useMemo(
    () =>
      deviceUtils.isIOS14
        ? hasClipboardData
        : clipboard !== accountAddress && isValidWallet(clipboard),
    [accountAddress, clipboard, hasClipboardData]
  );

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
    name => {
      navigate(Routes.MODAL_SCREEN, {
        actionType: 'Import',
        additionalPadding: true,
        asset: [],
        isNewProfile: true,
        onCloseModal: ({ color, name }) => {
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

  const handlePressImportButton = useCallback(async () => {
    if (!isSecretValid || !seedPhrase) return null;
    const input = sanitizeSeedPhrase(seedPhrase);
    let name = null;
    // Validate ENS
    if (isENSAddressFormat(input)) {
      try {
        const address = await web3Provider.resolveName(input);
        if (!address) {
          Alert.alert('This is not a valid ENS name');
          return;
        }
        setResolvedAddress(address);
        name = input;
        showWalletProfileModal(name);
      } catch (e) {
        Alert.alert(
          'Sorry, we cannot add this ENS name at this time. Please try again later!'
        );
        return;
      }
      // Look up ENS for 0x address
    } else if (isValidAddress(input)) {
      const ens = await web3Provider.lookupAddress(input);
      if (ens && ens !== input) {
        name = ens;
      }
      showWalletProfileModal(name);
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
            name = ens;
          }
          setBusy(false);
          showWalletProfileModal(name);
        }, 100);
      } catch (error) {
        logger.log('Error looking up ENS for imported HD type wallet', error);
        setBusy(false);
      }
    }
  }, [isSecretValid, seedPhrase, showWalletProfileModal]);

  const handlePressPasteButton = useCallback(() => {
    if (deviceUtils.isIOS14 && !hasClipboardData) return;
    getClipboard(result => {
      if (result !== accountAddress && isValidWallet(result)) {
        return handleSetSeedPhrase(result);
      }
      return onInvalidPaste();
    });
  }, [
    accountAddress,
    getClipboard,
    handleSetSeedPhrase,
    hasClipboardData,
    onInvalidPaste,
  ]);

  useEffect(() => {
    if (!wasImporting && isImporting) {
      startAnalyticsTimeout(async () => {
        const input = resolvedAddress
          ? resolvedAddress
          : sanitizeSeedPhrase(seedPhrase);

        const previousWalletCount = keys(wallets).length;
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
                  if (!(isENSAddressFormat(input) || isValidAddress(input))) {
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
  ]);

  useEffect(() => {
    setIsWalletLoading(
      isImporting ? walletLoadingStates.IMPORTING_WALLET : null
    );
  }, [isImporting, setIsWalletLoading]);

  return (
    <Container testID="import-sheet">
      <StatusBar barStyle="light-content" />
      <Sheet>
        <SheetHandle marginBottom={7} marginTop={6} />
        <Text size="large" weight="bold">
          Add Wallet
        </Text>
        <SecretTextAreaContainer>
          <SecretTextArea
            color={isSecretValid ? colors.appleBlue : colors.dark}
            onChangeText={handleSetSeedPhrase}
            onFocus={handleFocus}
            onSubmitEditing={handlePressImportButton}
            placeholder="Seed phrase, private key, Ethereum address or ENS name"
            ref={inputRef}
            returnKeyType="done"
            size="large"
            spellCheck={false}
            testID="import-sheet-input"
            value={seedPhrase}
          />
        </SecretTextAreaContainer>
        <Footer isSmallPhone={isSmallPhone}>
          {seedPhrase ? (
            <FooterButton
              disabled={!isSecretValid}
              hasLeadingIcon
              {...(android && { height: 30, overflowMargin: 15, width: 89 })}
              onPress={handlePressImportButton}
            >
              <Row>
                {busy ? (
                  <LoadingSpinner />
                ) : (
                  <Text align="center" color="white" weight="bold">
                    􀂍{' '}
                  </Text>
                )}
                <Text
                  align="center"
                  color="white"
                  testID="import-sheet-button-label"
                  weight="bold"
                >
                  Import
                </Text>
              </Row>
            </FooterButton>
          ) : (
            <FooterButton
              {...(android && { height: 30, overflowMargin: 15, width: 63 })}
              disabled={!isClipboardValidSecret}
              onPress={handlePressPasteButton}
            >
              <Text
                align="center"
                color="white"
                testID="import-sheet-button-label"
                weight="bold"
              >
                Paste
              </Text>
            </FooterButton>
          )}
        </Footer>
      </Sheet>
      <ToastPositionContainer bottom={keyboardHeight}>
        <InvalidPasteToast />
      </ToastPositionContainer>
      {ios ? <KeyboardSizeView isOpen /> : null}
    </Container>
  );
}
