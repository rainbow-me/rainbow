import React, { useEffect } from 'react';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/Divider' was resolved to '/U... Remove this comment to see the full error message
import Divider from '../components/Divider';
import { Row } from '../components/layout';
import { Sheet, SheetHandleFixedToTop, SheetTitle } from '../components/sheet';
import WalletConnectListItem, {
  WalletConnectListItemHeight,
  // @ts-expect-error ts-migrate(6142) FIXME: Module '../components/walletconnect-list/WalletCon... Remove this comment to see the full error message
} from '../components/walletconnect-list/WalletConnectListItem';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useWalletConnectConnections } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';

const MAX_VISIBLE_DAPPS = 7;

// @ts-expect-error ts-migrate(2339) FIXME: Property 'ScrollView' does not exist on type 'Styl... Remove this comment to see the full error message
const ScrollableItems = styled.ScrollView`
  height: ${({ length }: any) =>
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
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();

  useEffect(() => {
    if (walletConnectorsByDappName.length === 0) {
      goBack();
    }
  }, [goBack, walletConnectorsByDappName.length]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Sheet
      borderRadius={30}
      hideHandle
      noInsets
      paddingBottom={0}
      paddingTop={0}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <SheetHandleFixedToTop />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <SheetTitleWithPadding>Connected apps</SheetTitleWithPadding>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Divider color={colors.rowDividerExtraLight} inset={[0, 19]} />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ScrollableItems length={walletConnectorsByDappName.length}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Row height={4} />
        {walletConnectorsByDappName.map(
          ({ account, chainId, dappIcon, dappName, dappUrl, peerId }: any) => (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Row height={insets.bottom} />
      </ScrollableItems>
    </Sheet>
  );
}
