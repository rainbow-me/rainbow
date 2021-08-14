import React, { useEffect } from 'react';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components';
import Divider from '../components/Divider';
import { Row } from '../components/layout';
import { Sheet, SheetHandleFixedToTop, SheetTitle } from '../components/sheet';
import WalletConnectListItem, {
  WalletConnectListItemHeight,
} from '../components/walletconnect-list/WalletConnectListItem';
import { useWalletConnectConnections } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';

const MAX_VISIBLE_DAPPS = 7;

const ScrollableItems = styled.ScrollView`
  height: ${({ length }) =>
    WalletConnectListItemHeight * Math.min(length, MAX_VISIBLE_DAPPS) + 20};
`;

const SheetTitleWithPadding = styled(SheetTitle)`
  margin-top: 18;
  padding-bottom: 16;
`;

export default function ConnectedDappsSheet() {
  const { walletConnectorsByDappName } = useWalletConnectConnections();
  const { goBack } = useNavigation();
  const insets = useSafeArea();
  const { colors } = useTheme();

  useEffect(() => {
    if (walletConnectorsByDappName.length === 0) {
      goBack();
    }
  }, [goBack, walletConnectorsByDappName.length]);

  return (
    <Sheet
      borderRadius={30}
      hideHandle
      noInsets
      paddingBottom={0}
      paddingTop={0}
    >
      <SheetHandleFixedToTop />
      <SheetTitleWithPadding>Connected apps</SheetTitleWithPadding>
      <Divider color={colors.rowDividerExtraLight} inset={[0, 19]} />
      <ScrollableItems length={walletConnectorsByDappName.length}>
        <Row height={4} />
        {walletConnectorsByDappName.map(
          ({ account, chainId, dappIcon, dappName, dappUrl, peerId }) => (
            <WalletConnectListItem
              account={account}
              chainId={chainId}
              dappIcon={dappIcon}
              dappName={dappName}
              dappUrl={dappUrl}
              key={dappName}
              peerId={peerId}
            />
          )
        )}
        <Row height={insets.bottom} />
      </ScrollableItems>
    </Sheet>
  );
}
