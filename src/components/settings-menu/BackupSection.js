import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import TouchID from 'react-native-touch-id';
import PasscodeAuth from 'react-native-passcode-auth';

import { Monospace } from '../text';
import { Centered } from '../layout';
import { Button } from '../buttons';
import { loadSeedPhrase } from '../../model/wallet';

// ======================================================================
// Styles
// ======================================================================

const Content = styled(Centered).attrs({
  align: 'stretch',
})`
  flex: 1;
  flex-direction: column;
`;

const PhraseButton = styled(Button)`
  margin-top: auto;
  margin-bottom: auto;
  margin-left: auto;
  margin-right: auto;
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

// ======================================================================
// Component
// ======================================================================

class BackupSection extends React.Component {
  state = {
    seedPhrase: null,
  };

  showSeedPhrase = () => {
    TouchID.isSupported()
      .then(biometryType => {
        if (biometryType === 'FaceID' || biometryType === 'TouchID') {
          TouchID.authenticate('View seed phrase')
            .then(this.loadSeedPhrase)
            .catch(this.catchAuthError);
        }
      })
      .catch(error => {
        PasscodeAuth.authenticate('View seed phrase')
          .then(this.loadSeedPhrase)
          .catch(this.catchAuthError);
      });
  };

  hideSeedPhrase = () => {
    this.setState({ seedPhrase: null });
  };

  loadSeedPhrase = success => {
    loadSeedPhrase().then(seedPhrase => this.setState({ seedPhrase }));
  };

  catchAuthError = error => {
    this.hideSeedPhrase();
  };

  render() {
    return (
      <Content>
        {!this.state.seedPhrase && (
          <PhraseButton onPress={this.showSeedPhrase}>
            Show Seed Phrase
          </PhraseButton>
        )}
        {this.state.seedPhrase && (
          <React.Fragment>
            <PhraseButton onPress={this.hideSeedPhrase}>
              Hide Seed Phrase
            </PhraseButton>
            <SeedPhrase>{this.state.seedPhrase}</SeedPhrase>
          </React.Fragment>
        )}
      </Content>
    );
  }
}

BackupSection.propTypes = {};

export default BackupSection;
