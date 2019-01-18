import PropTypes from 'prop-types';
import React from 'react';
import { KeyboardAvoidingView } from 'react-native';
import { BorderlessButton } from 'react-native-gesture-handler';
import { pure, withProps } from 'recompact';
import styled from 'styled-components/primitives';
import { Icon } from '../components/icons';
import { MultiLineInput } from '../components/inputs';
import { Centered, Column, Row } from '../components/layout';
import { LoadingOverlay } from '../components/modal';
import { Text } from '../components/text';
import { borders, colors, padding } from '../styles';

const Container = styled(Column).attrs({
  align: 'center',
  flex: 1,
})`
  ${borders.buildRadius('top', 12)}
  ${padding(16)};
  background: ${colors.white};
  padding-top: 0;
`;

const Footer = withProps({
  align: 'start',
  behavior: 'padding',
  component: KeyboardAvoidingView,
  justify: 'space-between',
  keyboardVerticalOffset: 80,
  self: 'stretch',
})(Row);

const HelpButton = styled(BorderlessButton)`
  ${padding(6, 8)}
  border: 1px solid #f6f7f7;
  border-radius: 15px;
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

const InputContainer = styled(Centered)`
  ${padding(0, 50)}
  flex: 1;
`;

const SeedPhraseInput = styled(MultiLineInput)`
  width: 100%;
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
    <InputContainer>
      <SeedPhraseInput
        align="center"
        autoFocus
        enablesReturnKeyAutomatically={true}
        onChange={onInputChange}
        onSubmitEditing={onPressEnterKey}
        placeholder="Type your seed phrase"
        returnKeyType="done"
        size="large"
        value={seedPhrase}
        weight="semibold"
      />
    </InputContainer>
    <Footer>
      <HelpButton onPress={onPressHelp}>
        <Text
          align="center"
          color={colors.alpha(colors.blueGreyDark, 0.8)}
          weight="medium"
        >
          Help
        </Text>
      </HelpButton>
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
    </Footer>
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
