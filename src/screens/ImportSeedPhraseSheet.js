import PropTypes from 'prop-types';
import React from 'react';
import { KeyboardAvoidingView } from 'react-native';
import { BorderlessButton } from 'react-native-gesture-handler';
import { pure } from 'recompact';
import styled from 'styled-components/primitives';
import { Icon } from '../components/icons';
import { MultiLineInput } from '../components/inputs';
import { Centered, Column, Row } from '../components/layout';
import { LoadingOverlay } from '../components/modal';
import { Text } from '../components/text';
import transitionConfig from '../navigation/transitions';
import { borders, colors, padding } from '../styles';

const Container = styled(Column).attrs({
  align: 'center',
  flex: 1,
})`
  ${borders.buildRadius('top', 12)};
  ${padding(0, 16, 16)};
  background: ${colors.white};
`;

const HandleIcon = styled(Icon).attrs({
  color: '#C4C6CB',
  name: 'handle',
})`
  margin-top: 16px;
  margin-bottom: 2;
`;

const ImportButton = styled(Row).attrs({
  align: 'center',
  component: BorderlessButton,
})`
  ${padding(6, 8)}
  background: ${props => (props.disabled ? '#D2D3D7' : colors.appleBlue)};
  border-radius: 15px;
  shadow-color: ${colors.dark};
  shadow-offset: 0px 6px;
  shadow-opacity: 0.14;
  shadow-radius: 10;
`;

const ImportSeedPhraseSheet = ({
  isClipboardContentsValidSeedPhrase,
  isImporting,
  isSeedPhraseValid,
  onImportSeedPhrase,
  onInputChange,
  onPasteSeedPhrase,
  onPressEnterKey,
  onPressHelp,
  seedPhrase,
}) => (
  <Container>
    <HandleIcon />
    <Text size="large" weight="bold">Import</Text>
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={transitionConfig.sheetVerticalOffset + 19}
    >
      <Centered css={padding(0, 50)} flex={1}>
        <MultiLineInput
          align="center"
          autoFocus
          editable={!isImporting}
          enablesReturnKeyAutomatically={true}
          onChange={onInputChange}
          onSubmitEditing={onPressEnterKey}
          placeholder="Seed phrase or private key"
          returnKeyType="done"
          size="large"
          style={{ width: '100%' }}
          value={seedPhrase}
          weight="semibold"
        />
      </Centered>
      <Row align="start" justify="end">
        <ImportButton
          disabled={seedPhrase ? !isSeedPhraseValid : !isClipboardContentsValidSeedPhrase}
          onPress={seedPhrase ? onImportSeedPhrase : onPasteSeedPhrase}
        >
          {!!seedPhrase && (
            <Icon
              color={colors.white}
              direction="right"
              name="arrowCircled"
              style={{ paddingRight: 5 }}
            />
          )}
          <Text
            color="white"
            style={{ paddingLeft: seedPhrase ? 5 : 0 }}
            weight="bold"
          >
            {seedPhrase ? 'Import' : 'Paste'}
          </Text>
        </ImportButton>
      </Row>
    </KeyboardAvoidingView>
    {isImporting && (
      <LoadingOverlay title="Importing..." />
    )}
  </Container>
);

ImportSeedPhraseSheet.propTypes = {
  isClipboardContentsValidSeedPhrase: PropTypes.bool,
  isImporting: PropTypes.bool,
  isSeedPhraseValid: PropTypes.bool,
  navigation: PropTypes.object,
  onImportSeedPhrase: PropTypes.func,
  onInputChange: PropTypes.func,
  onPasteSeedPhrase: PropTypes.func,
  onPressEnterKey: PropTypes.func,
  onPressHelp: PropTypes.func,
  screenProps: PropTypes.shape({ handleWalletConfig: PropTypes.func }),
  seedPhrase: PropTypes.string,
  setSeedPhrase: PropTypes.func,
};

export default pure(ImportSeedPhraseSheet);
