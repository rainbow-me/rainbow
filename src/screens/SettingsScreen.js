import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import AppVersionStamp from '../components/AppVersionStamp';
import { Button, ButtonPressAnimation } from '../components/buttons';
import Icon from '../components/icons/Icon';
import { Centered, Column, Header, Page } from '../components/layout';
import { Monospace, TruncatedAddress } from '../components/text';
import CopyTooltip from '../components/CopyTooltip';
import QRCodeDisplay from '../components/QRCodeDisplay';
import { colors, fonts, padding } from '../styles';

const BackButton = styled.View`
  ${padding(20, 0, 4, 20)}
`;

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
  seedPhrase,
  onPressBackButton,
  onSendFeedback,
  onToggleShowSeedPhrase,
  showSeedPhrase,
}) => (
  <Page
    align="stretch"
    component={Column}
    justify="center"
    showBottomInset
  >
    <Header align="end" justify="end">
      <ButtonPressAnimation onPress={onPressBackButton}>
        <BackButton>
          <Icon
            color={colors.brightBlue}
            direction="right"
            name="caret"
          />
        </BackButton>
      </ButtonPressAnimation>
    </Header>
    <Content>
      <QRCodeDisplay value={address} />
      <WalletAddressTextContainer>
        <CopyTooltip textToCopy={address}>
          <TruncatedAddress
            address={address}
            size="big"
            weight="semibold"
          />
        </CopyTooltip>
      </WalletAddressTextContainer>
      <Button onPress={onSendFeedback}>Send Feedback</Button>
      <SeedPhraseButton onPress={onToggleShowSeedPhrase}>
        {showSeedPhrase ? 'Hide' : 'Show'} Seed Phrase
      </SeedPhraseButton>
    </Content>
    <SeedPhraseSection>
      {showSeedPhrase && (
        <SeedPhraseText>
          {seedPhrase}
        </SeedPhraseText>
      )}
    </SeedPhraseSection>
    <AppVersionStamp />
  </Page>
);

SettingsScreen.propTypes = {
  seedPhrase: PropTypes.string,
  address: PropTypes.string,
  onPressBackButton: PropTypes.func,
  onSendFeedback: PropTypes.func,
  onToggleShowSeedPhrase: PropTypes.func,
  showSeedPhrase: PropTypes.bool,
};

export default SettingsScreen;
