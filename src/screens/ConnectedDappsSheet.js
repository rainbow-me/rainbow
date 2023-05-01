import lang from 'i18n-js';
import React, { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Divider from '@/components/Divider';
import { Row } from '@/components/layout';
import { Sheet, SheetHandleFixedToTop, SheetTitle } from '@/components/sheet';
import WalletConnectListItem, {
  WalletConnectListItemHeight,
} from '@/components/walletconnect-list/WalletConnectListItem';
import { WalletConnectV2ListItem } from '@/components/walletconnect-list/WalletConnectV2ListItem';
import { useWalletConnectConnections } from '@/hooks';
import { useNavigation } from '@/navigation';
import styled from '@/styled-thing';
import { useWalletConnectV2Sessions } from '@/walletConnect/hooks/useWalletConnectV2Sessions';

const MAX_VISIBLE_DAPPS = 7;

const ScrollableItems = styled.ScrollView({
  height: ({ length }) =>
    WalletConnectListItemHeight * Math.min(length, MAX_VISIBLE_DAPPS) + 20,
});

const SheetTitleWithPadding = styled(SheetTitle)({
  marginTop: 18,
  paddingBottom: 16,
});

export default function ConnectedDappsSheet() {
  const { mostRecentWalletConnectors } = useWalletConnectConnections();
  const { goBack } = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { sessions, reload } = useWalletConnectV2Sessions();

  const numOfRows = mostRecentWalletConnectors.length + sessions.length;

  useEffect(() => {
    if (numOfRows === 0) {
      goBack();
    }
  }, [goBack, numOfRows]);

  return (
    <Sheet
      borderRadius={30}
      hideHandle
      noInsets
      paddingBottom={0}
      paddingTop={0}
    >
      <SheetHandleFixedToTop />
      <SheetTitleWithPadding>
        {lang.t('walletconnect.connected_apps')}
      </SheetTitleWithPadding>
      <Divider color={colors.rowDividerExtraLight} inset={[0, 19]} />
      <ScrollableItems length={numOfRows}>
        <Row height={4} />
        {sessions.map(session => (
          <WalletConnectV2ListItem
            key={session.topic}
            session={session}
            reload={reload}
          />
        ))}
        {mostRecentWalletConnectors.map(
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
