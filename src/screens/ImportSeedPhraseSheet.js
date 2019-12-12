import analytics from '@segment/analytics-react-native';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView } from 'react-native';
import { useClipboard } from 'react-native-hooks';
import { BorderlessButton } from 'react-native-gesture-handler';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import { useNavigation } from 'react-navigation-hooks';
import styled from 'styled-components/primitives';
import { Alert } from '../components/alerts';
import { Icon } from '../components/icons';
import { MultiLineInput } from '../components/inputs';
import { Centered, Column, Row, RowWithMargins } from '../components/layout';
import { LoadingOverlay } from '../components/modal';
import { Text } from '../components/text';
import { sheetVerticalOffset } from '../navigation/transitions/effects';
import { borders, colors, padding, shadow } from '../styles';
import { isValidSeed as validateSeed } from '../helpers/validators';

const keyboardVerticalOffset = sheetVerticalOffset + 19;
const statusBarHeight = getStatusBarHeight(true);

const Container = styled(Column).attrs({
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

const StyledImportButton = styled(BorderlessButton)`
  ${padding(6, 8)};
  ${shadow.build(0, 6, 10, colors.dark, 0.14)};
  background-color: ${({ disabled }) =>
    disabled ? '#D2D3D7' : colors.appleBlue};
  border-radius: 15px;
`;

const ConfirmImportAlert = onSuccess =>
  Alert({
    buttons: [
      {
        onPress: onSuccess,
        text: 'Import Wallet',
      },
      {
        style: 'cancel',
        text: 'Cancel',
      },
    ],
    message:
      'This will replace your existing wallet.\n\nBefore continuing, please make sure you’ve backed up or emptied it!',
    title: '🚨 Careful 🚨',
  });

const ImportButton = ({ disabled, onPress, seedPhrase }) => (
  <StyledImportButton disabled={disabled} onPress={onPress}>
    <RowWithMargins align="center" margin={5}>
      {!!seedPhrase && (
        <Icon color={colors.white} direction="right" name="arrowCircled" />
      )}
      <Text color="white" weight="bold">
        {seedPhrase ? 'Import' : 'Paste'}
      </Text>
    </RowWithMargins>
  </StyledImportButton>
);

const ImportSeedPhraseSheet = ({ initializeWallet, isEmpty }) => {
  const [clipboard] = useClipboard();
  const { navigate, setParams } = useNavigation();
  const [isImporting, setImporting] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState('');

  const isClipboardValidSeedPhrase = useMemo(() => validateSeed(clipboard), [
    clipboard,
  ]);

  const isSeedPhraseValid = useMemo(() => validateSeed(seedPhrase), [
    seedPhrase,
  ]);

  const toggleImporting = useCallback(
    newImportingState => {
      setImporting(newImportingState);
      setParams({ gesturesEnabled: !newImportingState });
    },
    [setImporting, setParams]
  );

  const handleSetSeedPhrase = useCallback(
    text => {
      if (isImporting) return null;
      return setSeedPhrase(text);
    },
    [isImporting, setSeedPhrase]
  );

  const onPressImportButton = () => {
    if (isSeedPhraseValid && seedPhrase) {
      return ConfirmImportAlert(() => toggleImporting(true));
    }

    if (isClipboardValidSeedPhrase && clipboard) {
      return handleSetSeedPhrase(clipboard);
    }
  };

  useEffect(() => {
    if (isImporting) {
      const id = setTimeout(() => {
        initializeWallet(seedPhrase.trim())
          .then(success => {
            if (success) {
              toggleImporting(false);
              analytics.track('Imported seed phrase', {
                hadPreviousAddressWithValue: isEmpty,
              });
              navigate('WalletScreen');
            } else {
              toggleImporting(false);
            }
          })
          .catch(error => {
            toggleImporting(false);
            console.error('error importing seed phrase: ', error);
          });
      }, 50);

      return () => clearTimeout(id);
    }
  }, [
    initializeWallet,
    isEmpty,
    isImporting,
    navigate,
    seedPhrase,
    toggleImporting,
  ]);

  return (
    <Container>
      <HandleIcon />
      <Text size="large" weight="bold">
        Import
      </Text>
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        <Centered css={padding(0, 50)} flex={1}>
          <MultiLineInput
            align="center"
            autoFocus
            enablesReturnKeyAutomatically
            onChangeText={handleSetSeedPhrase}
            onSubmitEditing={onPressImportButton}
            placeholder="Seed phrase or private key"
            returnKeyType="done"
            size="large"
            value={seedPhrase}
            weight="semibold"
            width="100%"
          />
        </Centered>
        <Row align="start" justify="end">
          <ImportButton
            disabled={
              seedPhrase ? !isSeedPhraseValid : !isClipboardValidSeedPhrase
            }
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
  initializeWallet: PropTypes.func,
  isEmpty: PropTypes.bool,
};

const neverRerender = () => true;
export default React.memo(ImportSeedPhraseSheet, neverRerender);
