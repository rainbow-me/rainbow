import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { compose, withHandlers, withProps, withState } from 'recompose';

import { loadSeedPhrase as loadSeedPhraseFromKeychain } from '../../model/wallet';
import { colors, margin, position } from '../../styles';
import { Br, Monospace, Text } from '../text';
import { Centered } from '../layout';
import { Button } from '../buttons';

const Container = styled(Centered).attrs({
  align: 'stretch',
})`
  flex: 1;
`;

const PhraseButton = styled(Button)`
  ${margin(28, 0, 0, 0)}
  background-color: ${colors.sendScreen.brightBlue};
`;

const Content = styled(Centered)`
  ${margin(6, 40)};
  align-items: center;
`;

const SeedPhrase = styled(Monospace).attrs({
  size: 'h5',
  weight: 'medium',
})`
  line-height: 28;
  max-width: 288;
  text-align: center;
  margin-top: 25;
  padding-left: 25;
  padding-right: 25;
`;

const BackupSection = ({ hideSeedPhrase, seedPhrase, showSeedPhrase }) => (
  <Centered direction="column" flex={1}>
    <Text size="large" weight="semibold">Your Seed Phrase</Text>
    <Content>
      <Text color="blueGreyLighter" style={{ lineHeight: 21, textAlign: 'center' }}>
        If you lose access to your device, the only way to restore your
        funds is with your 12-word seed phrase.
        <Br />
        <Br />
        Please store it in a safe place.
      </Text>
    </Content>
    {!seedPhrase && (
      <PhraseButton onPress={showSeedPhrase}>
        Show Seed Phrase
      </PhraseButton>
    )}
    {seedPhrase && (
      <Fragment>
        <PhraseButton onPress={hideSeedPhrase}>
          Hide Seed Phrase
        </PhraseButton>
        <SeedPhrase>{seedPhrase}</SeedPhrase>
      </Fragment>
    )}
  </Centered>
);

BackupSection.propTypes = {
  hideSeedPhrase: PropTypes.func.isRequired,
  seedPhrase: PropTypes.string,
  showSeedPhrase: PropTypes.func.isRequired,
};

export default compose(
  withState('seedPhrase', 'setSeedPhrase', null),
  withHandlers({ hideSeedPhrase: ({ setSeedPhrase }) => () => setSeedPhrase(null) }),
  withHandlers({
    showSeedPhrase: ({ hideSeedPhrase, setSeedPhrase }) => () =>
      loadSeedPhraseFromKeychain()
        .then(setSeedPhrase)
        .catch(hideSeedPhrase),
  }),
)(BackupSection);
