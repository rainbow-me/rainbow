import PropTypes from 'prop-types';
import React from 'react';
import { Dimensions } from 'react-native';
import styled from 'styled-components/primitives';
import { Button } from '../components/buttons';
import { Centered, Column } from '../components/layout';
import { Monospace } from '../components/text';
import CopyTooltip from '../components/CopyTooltip';
import QRCodeDisplay from '../components/QRCodeDisplay';
import { fonts, padding } from '../styles';

const Container = styled(Column).attrs({ align: 'center', justify: 'start' })`
  ${padding(28, 31)}
  height: 100%;
`;

const SettingsText = styled(Monospace).attrs({ size: 'h5', weight: 'medium' })`
  line-height: 28;
`;

const Footer = styled(SettingsText).attrs({ color: 'grey' })`
  bottom: 55;
  position: absolute;
`;

const SeedPhraseSection = styled(Centered).attrs({ direction: 'column' })`
  margin-top: ${fonts.size.h5};
`;

const SeedPhraseText = styled(SettingsText)`
  margin-top: 50;
  max-width: 288;
  text-align: center;
`;

const WalletAddressTextContainer = styled(Centered).attrs({ direction: 'column' })`
  margin-bottom: 52;
  margin-top: 22;
  width: 100%;
`;

const buildAddressAbbreviation = (address) => {
  const isSmallPhone = (Dimensions.get('window') < 375);
  const numChars = isSmallPhone ? 8 : 10;

  const sections = [
    address.substring(0, numChars),
    address.substring(address.length - numChars),
  ];

  return sections.join('...');
};

const SettingsScreen = ({
  address,
  onSendFeedback,
  onToggleShowSeedPhrase,
  showSeedPhrase,
}) => (
  <Container>
    <QRCodeDisplay value={address} />
    <WalletAddressTextContainer>
      <CopyTooltip textToCopy={address}>
        <Monospace size="big" weight="semibold">
          {buildAddressAbbreviation(address)}
        </Monospace>
      </CopyTooltip>
    </WalletAddressTextContainer>
    <Button onPress={onSendFeedback}>Send Feedback</Button>
    <SeedPhraseSection>
      <Button onPress={onToggleShowSeedPhrase}>Show Seed Phrase</Button>
      {showSeedPhrase && (
        <SeedPhraseText>
          REPLACE WITH SEED PHRASE witch collapse practice feed shame open despair creek road again ice least
        </SeedPhraseText>
      )}
    </SeedPhraseSection>
    <Footer>Balance v0.01</Footer>
  </Container>
);

SettingsScreen.propTypes = {
  address: PropTypes.string,
  onSendFeedback: PropTypes.func,
  onToggleShowSeedPhrase: PropTypes.func,
  showSeedPhrase: PropTypes.bool,
};

export default SettingsScreen;
