import React from 'react';
import { Row } from '../layout';
import { Text } from '../text';
import { WalletConnectList } from '../walletconnect-list';

export default function WalletConnectSection() {
  return (
    <>
      <Row marginTop={20} paddingHorizontal={22}>
        <Text marginLeft={10} size="larger" weight="bold">
          WalletConnect
        </Text>
      </Row>
      <WalletConnectList />
    </>
  );
}
