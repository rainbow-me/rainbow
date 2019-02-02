import React from 'react';
import { pure } from 'recompact';
import { margin, padding } from '../../styles';
import Divider from '../Divider';
import { Centered, Column } from '../layout';
import WalletConnectExplainerItem from './WalletConnectExplainerItem';
import WalletConnectLearnMoreButton from './WalletConnectLearnMoreButton';

const WalletConnectExplainer = () => (
  <Column css={padding(21, 0, 26, 19)}>
    <WalletConnectExplainerItem
      content="You can scan a QR code to send money."
      emoji="money_with_wings"
      title="Scan to send"
    />
    <Centered css={margin(18, 0)}>
      <Divider inset={false} />
    </Centered>
    <WalletConnectExplainerItem
      content="WalletConnect lets you connect to desktop websites by scanning a QR code."
      emoji="calling"
      title="Scan to connect your wallet"
    >
      <WalletConnectLearnMoreButton />
    </WalletConnectExplainerItem>
  </Column>
);

export default pure(WalletConnectExplainer);
