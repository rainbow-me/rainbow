import PropTypes from 'prop-types';
import React from 'react';
import FastImage from 'react-native-fast-image';
import { compose, withHandlers, withState } from 'recompact';
import styled from 'styled-components';
import SeedPhraseImageSource from '../../assets/seed-phrase-icon.png';
import { loadSeedPhrase as loadSeedPhraseFromKeychain } from '../../model/wallet';
import {
  colors,
  padding,
  position,
  shadow,
} from '../../styles';
import { Button } from '../buttons';
import { Centered, Column } from '../layout';
import { Br, Monospace, Text } from '../text';
import CopyTooltip from '../CopyTooltip';

const Container = styled(Column)`
  ${padding(80, 40, 0)};
`;

const Content = styled(Centered)`
  margin-bottom: 34;
  margin-top: 6;
  max-width: 265;
  padding-top: ${({ seedPhrase }) => (seedPhrase ? 34 : 0)}
`;

const ToggleSeedPhraseButton = styled(Button)`
  ${shadow.build(0, 6, 10, colors.purple, 0.14)}
  background-color: ${colors.appleBlue};
  width: 235;
`;

const BackupSection = ({
  hideSeedPhrase,
  navigation,
  seedPhrase,
  toggleSeedPhrase,
}) => (
  <Container align="center" flex={1}>
    <FastImage
      source={SeedPhraseImageSource}
      style={position.sizeAsObject(70)}
    />
    <Text
      lineHeight="loose"
      size="large"
      weight="semibold"
    >
      Your Seed Phrase
    </Text>
    <Content flex={0} seedPhrase={seedPhrase}>
      {seedPhrase
        ? (
          <CopyTooltip
            navigation={navigation}
            textToCopy={seedPhrase}
            tooltipText="Copy Seed Phrase"
          >
            <Monospace
              align="center"
              lineHeight="loosest"
              size="h5"
              weight="medium"
            >
              {seedPhrase}
            </Monospace>
          </CopyTooltip>
        ) : (
          <Text
            align="center"
            color="blueGreyLighter"
            lineHeight="loose"
          >
            If you lose access to your device, the only way to restore your
            funds is with your 12-word seed phrase.
            <Br />
            <Br />
            Please store it in a safe place.
          </Text>
        )
      }
    </Content>
    <ToggleSeedPhraseButton onPress={toggleSeedPhrase}>
      {seedPhrase ? 'Hide' : 'Show'} Seed Phrase
    </ToggleSeedPhraseButton>
  </Container>
);

BackupSection.propTypes = {
  hideSeedPhrase: PropTypes.func.isRequired,
  navigation: PropTypes.object,
  seedPhrase: PropTypes.string,
  toggleSeedPhrase: PropTypes.func.isRequired,
};

export default compose(
  withState('seedPhrase', 'setSeedPhrase', null),
  withHandlers({ hideSeedPhrase: ({ setSeedPhrase }) => () => setSeedPhrase(null) }),
  withHandlers({
    toggleSeedPhrase: ({ seedPhrase, hideSeedPhrase, setSeedPhrase }) => () => {
      if (!seedPhrase) {
        loadSeedPhraseFromKeychain()
          .then(setSeedPhrase)
          .catch(hideSeedPhrase);
      } else {
        hideSeedPhrase();
      }
    },
  }),
)(BackupSection);
