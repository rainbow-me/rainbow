import React from 'react';
import WalletConnectLogo from '../icons/WalletConnectLogo';
import { Row } from '../layout';
import { Text } from '../text';
import { WalletConnectList } from '../walletconnect-list';

export default function WalletConnectSection() {
  return (
    <>
      <Row marginTop={20} paddingHorizontal={22}>
        <WalletConnectLogo
          borderRadius={7.5}
          height={22}
          imageStyle={{ height: 13.5, width: 22 }}
          marginRight={7}
          marginTop={android ? 8 : 2}
          width={22}
        />
        <Text marginLeft={10} size="larger" weight="bold">
          WalletConnect
        </Text>
      </Row>
      <WalletConnectList />
    </>
  );
}
