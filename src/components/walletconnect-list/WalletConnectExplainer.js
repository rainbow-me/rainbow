import lang from 'i18n-js';
import React from 'react';
import Divider from '../Divider';
import { Centered, Column } from '../layout';
import WalletConnectExplainerItem from './WalletConnectExplainerItem';
import WalletConnectLearnMoreButton from './WalletConnectLearnMoreButton';
import { margin, padding } from '@rainbow-me/styles';

export default function WalletConnectExplainer() {
  return (
    <Column css={padding(21, 0, 26, 19)}>
      <WalletConnectExplainerItem
        content={lang.t('walletconnect.scan_to_send.description')}
        emoji="💸️"
        title={lang.t('walletconnect.scan_to_send.label')}
      />
      <Centered css={margin(18, 0)}>
        <Divider inset={false} />
      </Centered>
      <WalletConnectExplainerItem
        content={lang.t('walletconnect.scan_to_connect.description')}
        emoji="📲"
        title={lang.t('walletconnect.scan_to_connect.label')}
      >
        <WalletConnectLearnMoreButton />
      </WalletConnectExplainerItem>
    </Column>
  );
}
