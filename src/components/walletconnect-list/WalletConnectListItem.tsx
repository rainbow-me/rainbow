import analytics from '@segment/analytics-react-native';
import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../ChainLogo' was resolved to '/Users/nick... Remove this comment to see the full error message
import ChainLogo from '../ChainLogo';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../NetworkPill' was resolved to '/Users/ni... Remove this comment to see the full error message
import NetworkPill from '../NetworkPill';
import { RequestVendorLogoIcon } from '../coin-icon';
import { ContactAvatar } from '../contacts';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../contacts/ImageAvatar' was resolved to '... Remove this comment to see the full error message
import ImageAvatar from '../contacts/ImageAvatar';
import { ContextMenuButton } from '../context-menu';
import { Centered, Column, ColumnWithMargins, Row } from '../layout';
import { Text, TruncatedText } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/accountInf... Remove this comment to see the full error message
import { getAccountProfileInfo } from '@rainbow-me/helpers/accountInfo';
import {
  dappLogoOverride,
  dappNameOverride,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/dappNameHa... Remove this comment to see the full error message
} from '@rainbow-me/helpers/dappNameHandler';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/findWallet... Remove this comment to see the full error message
import { findWalletWithAccount } from '@rainbow-me/helpers/findWalletWithAccount';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/networkInf... Remove this comment to see the full error message
import networkInfo from '@rainbow-me/helpers/networkInfo';
import {
  androidShowNetworksActionSheet,
  changeConnectionMenuItems,
  NETWORK_MENU_ACTION_KEY_FILTER,
  networksMenuItems,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/walletConn... Remove this comment to see the full error message
} from '@rainbow-me/helpers/walletConnectNetworks';
import {
  useAccountSettings,
  useWalletConnectConnections,
  useWallets,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
} from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { Navigation, useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { ethereumUtils, showActionSheetWithOptions } from '@rainbow-me/utils';

const ContainerPadding = 15;
const VendorLogoIconSize = 50;
export const WalletConnectListItemHeight =
  VendorLogoIconSize + ContainerPadding * 2;

const LabelText = styled(Text).attrs(() => ({
  align: 'center',
  size: 'lmedium',
  weight: 'heavy',
}))`
  margin-bottom: 1;
`;

const networksAvailable = networksMenuItems();

const androidContextMenuActions = ['Switch Wallet', 'Disconnect'];

if (networksAvailable.length > 1) {
  androidContextMenuActions.splice(0, 0, 'Switch Network');
}

const AvatarWrapper = styled(Column)`
  margin-right: 5;
`;

const SessionRow = styled(Row)`
  align-items: center;
  justify-content: space-between;
`;

export default function WalletConnectListItem({
  account,
  chainId,
  dappIcon,
  dappName,
  dappUrl,
}: any) {
  const {
    walletConnectDisconnectAllByDappUrl,
    walletConnectUpdateSessionConnectorByDappUrl,
  } = useWalletConnectConnections();
  const { goBack } = useNavigation();
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  const { wallets, walletNames } = useWallets();
  const { network } = useAccountSettings();

  const overrideLogo = useMemo(() => {
    return dappLogoOverride(dappUrl);
  }, [dappUrl]);

  const overrideName = useMemo(() => {
    return dappNameOverride(dappUrl);
  }, [dappUrl]);

  const approvalAccountInfo = useMemo(() => {
    const selectedWallet = findWalletWithAccount(wallets, account);
    const approvalAccountInfo = getAccountProfileInfo(
      selectedWallet,
      walletNames,
      network,
      account
    );
    return {
      ...approvalAccountInfo,
    };
  }, [wallets, walletNames, network, account]);

  const connectionNetworkInfo = useMemo(() => {
    const network = ethereumUtils.getNetworkFromChainId(chainId);
    return {
      chainId,
      color: colors.networkColors[network],
      name: networkInfo[network]?.name,
      value: network,
    };
  }, [chainId, colors]);

  const handlePressChangeWallet = useCallback(() => {
    Navigation.handleAction(Routes.CHANGE_WALLET_SHEET, {
      currentAccountAddress: account,
      onChangeWallet: (address: any) => {
        walletConnectUpdateSessionConnectorByDappUrl(dappUrl, address, chainId);
        goBack();
      },
      watchOnly: true,
    });
  }, [
    account,
    chainId,
    dappUrl,
    goBack,
    walletConnectUpdateSessionConnectorByDappUrl,
  ]);

  const onPressAndroid = useCallback(() => {
    showActionSheetWithOptions(
      {
        options: androidContextMenuActions,
        showSeparators: true,
        title: overrideName || dappName,
      },
      (idx: any) => {
        if (idx === 0 && networksAvailable.length > 1) {
          androidShowNetworksActionSheet(({ chainId }: any) => {
            walletConnectUpdateSessionConnectorByDappUrl(
              dappUrl,
              account,
              chainId
            );
          });
        } else if ((idx === 0 && networksAvailable.length === 1) || idx === 1) {
          handlePressChangeWallet();
        } else if ((idx === 1 && networksAvailable.length === 1) || idx === 2) {
          walletConnectDisconnectAllByDappUrl(dappUrl);
          analytics.track(
            'Manually disconnected from WalletConnect connection',
            {
              dappName,
              dappUrl,
            }
          );
        }
      }
    );
  }, [
    account,
    dappName,
    dappUrl,
    handlePressChangeWallet,
    overrideName,
    walletConnectUpdateSessionConnectorByDappUrl,
    walletConnectDisconnectAllByDappUrl,
  ]);

  const handleOnPressMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }) => {
      if (actionKey === 'disconnect') {
        walletConnectDisconnectAllByDappUrl(dappUrl);
        analytics.track('Manually disconnected from WalletConnect connection', {
          dappName,
          dappUrl,
        });
      } else if (actionKey === 'switch-account') {
        handlePressChangeWallet();
      } else if (actionKey.indexOf(NETWORK_MENU_ACTION_KEY_FILTER) !== -1) {
        const networkValue = actionKey.replace(
          NETWORK_MENU_ACTION_KEY_FILTER,
          ''
        );
        const chainId = ethereumUtils.getChainIdFromNetwork(networkValue);
        walletConnectUpdateSessionConnectorByDappUrl(dappUrl, account, chainId);
      }
    },
    [
      account,
      dappName,
      dappUrl,
      handlePressChangeWallet,
      walletConnectDisconnectAllByDappUrl,
      walletConnectUpdateSessionConnectorByDappUrl,
    ]
  );

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ContextMenuButton
      menuItems={changeConnectionMenuItems()}
      menuTitle={overrideName || dappName}
      onPressAndroid={onPressAndroid}
      onPressMenuItem={handleOnPressMenuItem}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Row align="center" height={WalletConnectListItemHeight}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Row
          align="center"
          css={padding(ContainerPadding, 0, ContainerPadding, ContainerPadding)}
          flex={1}
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <RequestVendorLogoIcon
            backgroundColor={colors.white}
            dappName={dappName}
            imageUrl={overrideLogo || dappIcon}
            size={VendorLogoIconSize}
          />
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <ColumnWithMargins css={padding(0, 19, 0, 12)} flex={1} margin={5}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Row width="70%">
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <TruncatedText size="lmedium" weight="heavy">
                {overrideName || dappName || 'Unknown Application'}{' '}
              </TruncatedText>
            </Row>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <SessionRow>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Centered>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <AvatarWrapper>
                  {approvalAccountInfo.accountImage ? (
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <ImageAvatar
                      image={approvalAccountInfo.accountImage}
                      size="smaller"
                    />
                  ) : (
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <ContactAvatar
                      color={
                        isNaN(approvalAccountInfo.accountColor)
                          ? colors.skeleton
                          : approvalAccountInfo.accountColor
                      }
                      size="smaller"
                      value={approvalAccountInfo.accountSymbol}
                    />
                  )}
                </AvatarWrapper>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <TruncatedText
                  size="medium"
                  style={{ color: colors.alpha(colors.blueGreyDark, 0.6) }}
                  weight="bold"
                >
                  {approvalAccountInfo.accountName}
                </TruncatedText>
              </Centered>
            </SessionRow>
          </ColumnWithMargins>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <ContextMenuButton
            menuItems={networksMenuItems()}
            menuTitle="Change Network"
            onPressAndroid={onPressAndroid}
            onPressMenuItem={handleOnPressMenuItem}
          >
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <NetworkPill mainnet={connectionNetworkInfo.value === 'mainnet'}>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <ChainLogo network={connectionNetworkInfo.value} />
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <LabelText
                color={
                  connectionNetworkInfo.value === 'mainnet'
                    ? colors.alpha(colors.blueGreyDark, 0.5)
                    : colors.alpha(colors.blueGreyDark, 0.8)
                }
                numberOfLines={1}
              >
                {connectionNetworkInfo.name}
              </LabelText>
            </NetworkPill>
          </ContextMenuButton>
        </Row>
      </Row>
    </ContextMenuButton>
  );
}
