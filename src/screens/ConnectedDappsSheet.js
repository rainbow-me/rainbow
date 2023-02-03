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
import { signClient, getAllActiveSessionsSync } from '@/utils/walletConnect';
import { logger } from '@/logger';
import { events } from '@/handlers/appEvents';

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
  const [loadSessions, setLoadSessions] = React.useState(true);
  const [sessions, setSessions] = React.useState(
    getAllActiveSessionsSync() || []
  );

  const numOfRows = mostRecentWalletConnectors.length + sessions.length;

  /**
   * Load and reload functionality
   */
  React.useEffect(() => {
    function load() {
      const sessions = getAllActiveSessionsSync();
      setSessions(sessions);
      setLoadSessions(false);
    }

    if (loadSessions) load();
  }, [loadSessions, setLoadSessions, setSessions]);

  /**
   * Listen for new or disconnected sessions to add or remove from list.
   *
   * Really only needed if the list is already opened, since we otherwise
   * lazily check for sessions when the user clicks on the overflow menu
   * button.
   */
  React.useEffect(() => {
    (async function listenForDeletedSessions() {
      const client = await signClient;

      // client handles disconnected sessions
      client.on('session_delete', () => {
        const sessions = client.session.values;
        setSessions(sessions);
        logger.debug(
          `ConnectedDappsSheet: handling session_delete`,
          {},
          logger.DebugContext.walletconnect
        );
      });
    })();

    events.on('walletConnectV2SessionCreated', () => {
      setLoadSessions(true); // force reload
    });
  }, []);

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
            reload={() => setLoadSessions(true)}
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
