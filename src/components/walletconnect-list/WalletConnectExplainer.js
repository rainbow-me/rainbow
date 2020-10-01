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
        content="You can scan a QR code to send money."
        emoji="💸️"
        title="Scan to send"
      />
      <Centered css={margin(18, 0)}>
        <Divider inset={false} />
      </Centered>
      <WalletConnectExplainerItem
        content="WalletConnect lets you connect to desktop websites by scanning a QR code."
        emoji="📲"
        title="Scan to connect your wallet"
      >
        <WalletConnectLearnMoreButton />
      </WalletConnectExplainerItem>
    </Column>
  );
}
