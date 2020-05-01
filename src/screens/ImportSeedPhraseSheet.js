import analytics from '@segment/analytics-react-native';
import PropTypes from 'prop-types';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { BorderlessButton } from 'react-native-gesture-handler';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import { useNavigation } from 'react-navigation-hooks';
import styled from 'styled-components/primitives';
import { Alert } from '../components/alerts';
import { Button } from '../components/buttons';
import { Icon } from '../components/icons';
import { Input } from '../components/inputs';
import { Centered, Column, Row, RowWithMargins } from '../components/layout';
import { LoadingOverlay } from '../components/modal';
import { Text } from '../components/text';
import { web3Provider } from '../handlers/web3';
import isNativeStackAvailable from '../helpers/isNativeStackAvailable';
import { isENSAddressFormat, isValidWallet } from '../helpers/validators';
import {
  useAccountSettings,
  useClipboard,
  useInitializeWallet,
  usePrevious,
  useTimeout,
} from '../hooks';
import { sheetVerticalOffset } from '../navigation/transitions/effects';
import { borders, colors, padding, shadow } from '../styles';
import { logger } from '../utils';
import Routes from './Routes/routesNames';

const keyboardVerticalOffset =
  Platform.OS === 'android'
    ? sheetVerticalOffset - 240
    : sheetVerticalOffset + 10;

const statusBarHeight = getStatusBarHeight(true);

const Container = isNativeStackAvailable
  ? styled(Column).attrs({
      align: 'center',
      flex: 1,
    })`
      ${padding(0, 19)};
      background: ${colors.white};
    `
  : styled(Column).attrs({
      align: 'center',
      flex: 1,
    })`
      ${borders.buildRadius('top', 16)};
      ${padding(0, 16, 16)};
      background: ${colors.white};
      top: ${statusBarHeight};
    `;

const HandleIcon = styled(Icon).attrs({
  color: '#C4C6CB',
  name: 'handle',
})`
  margin-top: 16px;
  margin-bottom: 2;
`;

const StyledImportButton = styled(
  Platform.OS === 'ios' ? BorderlessButton : Button
)`
  ${padding(5, 9, 7)};
  ${shadow.build(0, 6, 10, colors.dark, 0.16)};
  background-color: ${({ disabled }) =>
    disabled ? '#D2D3D7' : colors.appleBlue};
  border-radius: 15px;
  margin-bottom: 19px;
`;

const StyledInput = styled(Input)`
  min-height: 50;
`;

const ConfirmImportAlert = (onSuccess, navigate) =>
  Alert({
    buttons: [
      {
        onPress: () =>
          navigate(Routes.MODAL_SCREEN, {
            actionType: 'Import',
            address: undefined,
            asset: [],
            isCurrentProfile: false,
            isNewProfile: true,
            onCloseModal: args => {
              if (args) {
                onSuccess(args);
              } else {
                onSuccess({
                  color: colors.getRandomColor(),
                  name: 'Imported Wallet',
                });
              }
            },
            profile: {},
            type: 'wallet_profile_creator',
          }),
        text: 'Import Wallet',
      },
      {
        style: 'cancel',
        text: 'Cancel',
      },
    ],
    message:
      'You can switch between your existing wallets in the top navbar of the profile screen.',
    title: 'Import new wallet',
  });

const ImportButton = ({ disabled, onPress, seedPhrase }) => (
  <StyledImportButton disabled={disabled} onPress={onPress} overflow="visible">
    <RowWithMargins align="center" margin={5}>
      {!!seedPhrase && (
        <Icon color={colors.white} direction="right" name="arrowCircled" />
      )}
      <Text color="white" weight="semibold">
        {seedPhrase ? 'Import' : 'Paste'}
      </Text>
    </RowWithMargins>
  </StyledImportButton>
);

const ImportSeedPhraseSheet = ({ isEmpty, setAppearListener }) => {
  const { accountAddress } = useAccountSettings();
  const { clipboard } = useClipboard();
  const { navigate, setParams } = useNavigation();
  const initializeWallet = useInitializeWallet();
  const [isImporting, setImporting] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState('');
  const [color, setColor] = useState(null);
  const [name, setName] = useState(null);
  const [startFocusTimeout] = useTimeout();
  const [startAnalyticsTimeout] = useTimeout();
  const wasImporting = usePrevious(isImporting);

  const isClipboardValidSecret = useMemo(() => {
    return clipboard !== accountAddress && isValidWallet(clipboard);
  }, [accountAddress, clipboard]);

  const isSecretValid = useMemo(() => {
    return seedPhrase !== accountAddress && isValidWallet(seedPhrase);
  }, [accountAddress, seedPhrase]);

  const inputRef = useRef(null);
  const focusListener = useCallback(() => {
    inputRef.current && inputRef.current.focus();
  }, []);

  const inputRefListener = useCallback(
    value => {
      value && startFocusTimeout(value.focus, 100);
      inputRef.current = value;
    },
    [startFocusTimeout]
  );

  useEffect(() => {
    setAppearListener && setAppearListener(focusListener);
    return () => setAppearListener && setAppearListener(null);
  });

  const handleSetSeedPhrase = useCallback(
    text => {
      if (isImporting) return null;
      return setSeedPhrase(text);
    },
    [isImporting]
  );

  const toggleImporting = useCallback(
    newImportingState => {
      setImporting(newImportingState);
      setParams({ gesturesEnabled: !newImportingState });
    },
    [setParams]
  );

  const onPressImportButton = useCallback(() => {
    if (isSecretValid && seedPhrase) {
      return ConfirmImportAlert(({ color, name }) => {
        if (color) setColor(color);
        if (name) setName(name);
        toggleImporting(true);
      }, navigate);
    }

    if (isClipboardValidSecret && clipboard) {
      return handleSetSeedPhrase(clipboard);
    }
  }, [
    clipboard,
    handleSetSeedPhrase,
    isClipboardValidSecret,
    isSecretValid,
    navigate,
    seedPhrase,
    toggleImporting,
  ]);

  useEffect(() => {
    if (!wasImporting && isImporting) {
      startAnalyticsTimeout(async () => {
        let input = seedPhrase.trim();
        if (isENSAddressFormat(input)) {
          try {
            input = await web3Provider.resolveName(input);
            if (!input) {
              Alert.alert('This is not a valid ENS name');
              return;
            }
          } catch (e) {
            Alert.alert('This is not a valid ENS name');
            return;
          }
        }

        initializeWallet(input, color, name || 'Imported Wallet')
          .then(success => {
            if (success) {
              toggleImporting(false);
              analytics.track('Imported seed phrase', {
                hadPreviousAddressWithValue: isEmpty,
              });
              navigate(Routes.WALLET_SCREEN);
            } else {
              toggleImporting(false);
            }
          })
          .catch(error => {
            toggleImporting(false);
            logger.error('error importing seed phrase: ', error);
          });
      }, 50);
    }
  }, [
    color,
    initializeWallet,
    isEmpty,
    isImporting,
    name,
    navigate,
    seedPhrase,
    startAnalyticsTimeout,
    toggleImporting,
    wasImporting,
  ]);

  return (
    <Container>
      <StatusBar barStyle="light-content" />
      <HandleIcon />
      <Text size="large" weight="bold">
        Import
      </Text>
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        <Centered css={padding(0, 50)} flex={1}>
          <StyledInput
            align="center"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            enablesReturnKeyAutomatically
            keyboardType={
              Platform.OS === 'android' ? 'visible-password' : 'default'
            }
            lineHeight="looser"
            multiline
            numberOfLines={7}
            onChangeText={handleSetSeedPhrase}
            onSubmitEditing={onPressImportButton}
            placeholder="Seed phrase, private key, Ethereum account or ENS name"
            ref={isNativeStackAvailable ? inputRef : inputRefListener}
            returnKeyType="done"
            size="large"
            value={seedPhrase}
            weight="semibold"
            width="100%"
          />
        </Centered>
        <Row align="start" justify="end">
          <ImportButton
            disabled={seedPhrase ? !isSecretValid : !isClipboardValidSecret}
            onPress={onPressImportButton}
            seedPhrase={seedPhrase}
          />
        </Row>
        {isImporting && (
          <LoadingOverlay
            paddingTop={keyboardVerticalOffset}
            title="Importing..."
          />
        )}
      </KeyboardAvoidingView>
    </Container>
  );
};

ImportSeedPhraseSheet.propTypes = {
  isEmpty: PropTypes.bool,
  setAppearListener: PropTypes.func,
};

const neverRerender = () => true;
export default React.memo(ImportSeedPhraseSheet, neverRerender);
