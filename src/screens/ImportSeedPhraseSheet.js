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
import { Alert, InteractionManager, Platform, StatusBar } from 'react-native';
import { IS_TESTING } from 'react-native-dotenv';
import { KeyboardArea } from 'react-native-keyboard-area';
import styled from 'styled-components/primitives';
import ActivityIndicator from '../components/ActivityIndicator';
import { MiniButton } from '../components/buttons';
import { Input } from '../components/inputs';
import { Centered, Column, Row } from '../components/layout';
import LoadingOverlay from '../components/modal/LoadingOverlay';
import { SheetHandle } from '../components/sheet';
import { Text } from '../components/text';
import { getWallet } from '../model/wallet';

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
  useIsWalletEthZero,
  useMagicAutofocus,
  usePrevious,
  useTimeout,
  useWallets,
} from '@rainbow-me/hooks';
import { Navigation, useNavigation } from '@rainbow-me/navigation';
import { sheetVerticalOffset } from '@rainbow-me/navigation/effects';
import Routes from '@rainbow-me/routes';
import { borders, colors, padding } from '@rainbow-me/styles';
import logger from 'logger';
import { usePortal } from 'react-native-cool-modals/Portal';

const sheetBottomPadding = 19;
const keyboardVerticalOffset =
  Platform.OS === 'android'
    ? sheetVerticalOffset - 240
    : sheetVerticalOffset + 10;

const Container = styled.View`
  flex: 1;
  padding-top: ${isNativeStackAvailable ? 0 : sheetVerticalOffset};
`;

const Footer = styled(Row).attrs({
  align: 'start',
  justify: 'end',
})`
  bottom: ${Platform.OS === 'android' ? 55 : 0};
  position: ${Platform.OS === 'android' ? 'absolute' : 'relative'};
  right: 0;
  top: ${({ isSmallPhone }) => (isSmallPhone ? sheetBottomPadding * 2 : 0)};
  width: 100%;
`;

const Spinner = styled(ActivityIndicator).attrs({
  color: 'white',
  size: 15,
})`
  margin-right: 5px;
  margin-top: 2px;
`;

const FooterButton = styled(MiniButton).attrs({
  compensateForTransformOrigin: true,
  testID: 'import-sheet-button',
  transformOrigin: 'right',
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
  keyboardType: Platform.OS === 'android' ? 'visible-password' : 'default',
  lineHeight: 'looser',
  multiline: true,
  numberOfLines: 3,
  placeholder: 'Seed phrase, private key, Ethereum address or ENS name',
  returnKeyType: 'done',
  size: 'large',
  spellCheck: false,
  weight: 'semibold',
})`
  margin-bottom: ${Platform.OS === 'android' ? 55 : 0};
  min-height: 50;
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
  const { selectedWallet, wallets } = useWallets();
  const { clipboard } = useClipboard();
  const { isSmallPhone } = useDimensions();
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
  const { setComponent, hide } = usePortal();

  const inputRef = useRef(null);
  const { handleFocus } = useMagicAutofocus(inputRef);

  const isClipboardValidSecret = useMemo(() => {
    return clipboard !== accountAddress && isValidWallet(clipboard);
  }, [accountAddress, clipboard]);

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
    const input = seedPhrase.trim();
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
          const { hdnode, isHDWallet, type, wallet } = getWallet(input);
          setCheckedWallet({ hdnode, isHDWallet, type, wallet });
          const ens = await web3Provider.lookupAddress(wallet?.address);
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
    if (clipboard && isClipboardValidSecret) {
      return handleSetSeedPhrase(clipboard);
    }
  }, [clipboard, handleSetSeedPhrase, isClipboardValidSecret]);

  useEffect(() => {
    if (!wasImporting && isImporting) {
      startAnalyticsTimeout(async () => {
        const input = resolvedAddress ? resolvedAddress : seedPhrase.trim();
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
                if (Platform.OS === 'android') {
                  hide();
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
    hide,
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
    if (isImporting) {
      setComponent(
        <LoadingOverlay
          paddingTop={keyboardVerticalOffset}
          title={walletLoadingStates.IMPORTING_WALLET}
        />,
        true
      );
      return hide;
    }
  }, [hide, isImporting, setComponent]);

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
              onPress={handlePressImportButton}
            >
              <Row>
                {busy ? (
                  <Spinner />
                ) : (
                  <Text color="white" weight="semibold">
                    􀂍{' '}
                  </Text>
                )}
                <Text
                  color="white"
                  testID="import-sheet-button-label"
                  weight="semibold"
                >
                  Import
                </Text>
              </Row>
            </FooterButton>
          ) : (
            <FooterButton
              disabled={!isClipboardValidSecret}
              onPress={handlePressPasteButton}
            >
              <Text
                color="white"
                testID="import-sheet-button-label"
                weight="semibold"
              >
                Paste
              </Text>
            </FooterButton>
          )}
        </Footer>
      </Sheet>
      <KeyboardSizeView isOpen />
    </Container>
  );
}
