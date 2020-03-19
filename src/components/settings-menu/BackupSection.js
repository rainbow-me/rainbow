import analytics from '@segment/analytics-react-native';
import PropTypes from 'prop-types';
import React from 'react';
import FastImage from 'react-native-fast-image';
import { compose, withHandlers, withState } from 'recompact';
import styled from 'styled-components';
import SeedPhraseImageSource from '../../assets/seed-phrase-icon.png';
import { loadSeedPhrase as loadSeedPhraseFromKeychain } from '../../model/wallet';
import { colors, padding, position, shadow } from '../../styles';
import { Button } from '../buttons';
import { Centered, Column } from '../layout';
import { Br, Monospace, Text } from '../text';
import CopyTooltip from '../copy-tooltip';

const Content = styled(Centered)`
  margin-bottom: 34;
  margin-top: 6;
  max-width: 265;
  padding-top: ${({ seedPhrase }) => (seedPhrase ? 34 : 0)};
`;

const ToggleSeedPhraseButton = styled(Button)`
  ${shadow.build(0, 5, 15, colors.purple, 0.3)}
  background-color: ${colors.appleBlue};
  width: 235;
`;

const BackupSection = ({ navigation, seedPhrase, toggleSeedPhrase }) => (
  <Column align="center" css={padding(80, 40, 0)} flex={1}>
    <FastImage
      source={SeedPhraseImageSource}
      style={position.sizeAsObject(70)}
    />
    <Text lineHeight="loosest" size="larger" weight="semibold">
      Your Private Key
    </Text>
    <Content flex={0} seedPhrase={seedPhrase}>
      {seedPhrase ? (
        <CopyTooltip
          navigation={navigation}
          textToCopy={seedPhrase}
          tooltipText="Copy Private Key"
        >
          <Monospace
            align="center"
            lineHeight="looser"
            size="large"
            weight="regular"
          >
            {seedPhrase}
          </Monospace>
        </CopyTooltip>
      ) : (
        <Text
          align="center"
          color={colors.alpha(colors.blueGreyDark, 0.6)}
          lineHeight="loose"
          size="lmedium"
        >
          If you lose access to your device, the only way to restore your funds
          is with your private key.
          <Br />
          <Br />
          Please store it in a safe place.
        </Text>
      )}
    </Content>
    <ToggleSeedPhraseButton onPress={toggleSeedPhrase}>
      {seedPhrase ? 'Hide' : 'Show'} Private Key
    </ToggleSeedPhraseButton>
  </Column>
);

BackupSection.propTypes = {
  navigation: PropTypes.object,
  seedPhrase: PropTypes.string,
  toggleSeedPhrase: PropTypes.func.isRequired,
};

export default compose(
  withState('seedPhrase', 'setSeedPhrase', null),
  withHandlers({
    hideSeedPhrase: ({ setSeedPhrase }) => () => setSeedPhrase(null),
  }),
  withHandlers({
    toggleSeedPhrase: ({ hideSeedPhrase, seedPhrase, setSeedPhrase }) => () => {
      if (!seedPhrase) {
        loadSeedPhraseFromKeychain()
          .then(keychainValue => {
            setSeedPhrase(keychainValue);
            analytics.track('Viewed backup seed phrase text');
          })
          .catch(hideSeedPhrase);
      } else {
        hideSeedPhrase();
      }
    },
  })
)(BackupSection);
