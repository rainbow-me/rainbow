import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import AppVersionStamp from '../components/AppVersionStamp';
import { Button } from '../components/buttons';
import { BackButton, Header } from '../components/header';
import { Centered, Column, Page } from '../components/layout';
import { Monospace, TruncatedAddress } from '../components/text';
import CopyTooltip from '../components/CopyTooltip';
import QRCodeDisplay from '../components/QRCodeDisplay';
import { colors, fonts, padding } from '../styles';

const Content = styled(Column).attrs({ align: 'center', justify: 'start' })`
  ${padding(2, 31, 0)}
  flex-shrink: 0;
`;

const SeedPhraseButton = styled(Button)`
  margin-top: ${fonts.size.h5};
`;

const SeedPhraseSection = styled(Centered)`
  flex: 1;
`;

const SeedPhraseText = styled(Monospace).attrs({ size: 'h5', weight: 'medium' })`
  line-height: 28;
  max-width: 288;
  text-align: center;
`;

const WalletAddressTextContainer = styled(Centered).attrs({ direction: 'column' })`
  margin-bottom: 52;
  margin-top: 22;
  width: 100%;
`;

const SettingsScreen = ({
  address,
  onPressBackButton,
  onSendFeedback,
  onToggleShowSeedPhrase,
  seedPhrase,
}) => (
  <Page
    align="stretch"
    component={Column}
    justify="center"
    showBottomInset
  >
    <Header align="end" justify="end">
      <BackButton
        color={colors.brightBlue}
        direction="right"
      />
    </Header>
    <Content>
      <QRCodeDisplay value={address} />
      <WalletAddressTextContainer>
        <CopyTooltip textToCopy={address} tooltipText="Copy Address">
          <TruncatedAddress
            address={address}
            size="big"
            weight="semibold"
          />
        </CopyTooltip>
      </WalletAddressTextContainer>
      <Button onPress={onSendFeedback}>Send Feedback</Button>
      <SeedPhraseButton onPress={onToggleShowSeedPhrase}>
        {seedPhrase ? 'Hide' : 'Show'} Seed Phrase
      </SeedPhraseButton>
    </Content>
    <SeedPhraseSection>
      {seedPhrase && (
        <CopyTooltip textToCopy={seedPhrase} tooltipText="Copy Seed Phrase">
          <SeedPhraseText>
            {seedPhrase}
          </SeedPhraseText>
        </CopyTooltip>
      )}
    </SeedPhraseSection>
    <AppVersionStamp />
  </Page>
);

SettingsScreen.propTypes = {
  address: PropTypes.string,
  onPressBackButton: PropTypes.func,
  onSendFeedback: PropTypes.func,
  onToggleShowSeedPhrase: PropTypes.func,
  seedPhrase: PropTypes.string,
};

export default SettingsScreen;
