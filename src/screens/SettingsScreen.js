import PropTypes from 'prop-types';
import React from 'react';
import lang from 'i18n-js';
import { onlyUpdateForPropTypes } from 'recompact';
import styled from 'styled-components/primitives';
import AppVersionStamp from '../components/AppVersionStamp';
import { Button } from '../components/buttons';
import { BackButton, Header } from '../components/header';
import { Centered, Column, Page } from '../components/layout';
import SendFeedback from '../components/SendFeedback';
import { Monospace, TruncatedAddress } from '../components/text';
import CopyTooltip from '../components/CopyTooltip';
import QRCodeDisplay from '../components/QRCodeDisplay';
import { colors, fonts, padding } from '../styles';
import { deviceUtils } from '../utils';

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
  margin-bottom: ${(deviceUtils.dimensions.height < 700) ? 30 : 52};
  margin-top: 22;
  width: 100%;
`;

const SettingsScreen = ({
  accountAddress,
  onPressBackButton,
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
        onPress={onPressBackButton}
      />
    </Header>
    <Content>
      <QRCodeDisplay
        size={(deviceUtils.dimensions.width * (150 / deviceUtils.iPhoneXWidth))}
        value={accountAddress}
      />
      <WalletAddressTextContainer>
        <CopyTooltip textToCopy={accountAddress} tooltipText={lang.t('wallet.settings.copy_address')}>
          <TruncatedAddress
            address={accountAddress}
            size="big"
            weight="semibold"
          />
        </CopyTooltip>
      </WalletAddressTextContainer>
      <SendFeedback />
      <SeedPhraseButton onPress={onToggleShowSeedPhrase}>
        {seedPhrase ? lang.t('wallet.settings.hide_seed_phrase') : lang.t('wallet.settings.show_seed_phrase')}
      </SeedPhraseButton>
    </Content>
    <SeedPhraseSection>
      {seedPhrase && (
        <CopyTooltip textToCopy={seedPhrase} tooltipText={lang.t('wallet.settings.copy_seed_phrase')}>
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
  accountAddress: PropTypes.string,
  onPressBackButton: PropTypes.func,
  onToggleShowSeedPhrase: PropTypes.func,
  seedPhrase: PropTypes.string,
};

export default onlyUpdateForPropTypes(SettingsScreen);
