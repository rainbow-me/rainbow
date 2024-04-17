import React, { useCallback, useMemo } from 'react';
import { SessionTypes } from '@walletconnect/types';
import RadialGradient from 'react-native-radial-gradient';

import { RequestVendorLogoIcon } from '../coin-icon';
import { ContactAvatar } from '../contacts';
import ImageAvatar from '../contacts/ImageAvatar';
import { ContextMenuButton } from '../context-menu';
import { Centered, ColumnWithMargins, Row } from '../layout';
import { TruncatedText } from '../text';
import { analytics } from '@/analytics';
import { getAccountProfileInfo } from '@/helpers/accountInfo';
import { findWalletWithAccount } from '@/helpers/findWalletWithAccount';
import { changeConnectionMenuItems } from '@/helpers/walletConnectNetworks';
import { useWallets } from '@/hooks';
import { Navigation, useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import styled from '@/styled-thing';
import { padding, position } from '@/styles';
import { ethereumUtils, showActionSheetWithOptions } from '@/utils';
import * as lang from '@/languages';
import { useTheme } from '@/theme';
import { logger, RainbowError } from '@/logger';
import { changeAccount, disconnectSession, isSupportedChain } from '@/walletConnect';
import { Box, Inline } from '@/design-system';
import ChainBadge from '@/components/coin-icon/ChainBadge';
import { Network } from '@/helpers';
import { EthCoinIcon } from '../coin-icon/EthCoinIcon';

const CONTAINER_PADDING = 15;
const VENDOR_LOGO_ICON_SIZE = 50;
export const WALLET_CONNECT_LIST_ITEM_HEIGHT = VENDOR_LOGO_ICON_SIZE + CONTAINER_PADDING * 2;

const androidContextMenuActions = [lang.t('walletconnect.switch_wallet'), lang.t('walletconnect.disconnect')];

const SessionRow = styled(Row)({
  alignItems: 'center',
  justifyContent: 'flex-start',
});

const rowStyle = padding.object(CONTAINER_PADDING, CONTAINER_PADDING, CONTAINER_PADDING + 10, CONTAINER_PADDING);

const columnStyle = padding.object(0, 10, 0, 12);

export function WalletConnectV2ListItem({ session, reload }: { session: SessionTypes.Struct; reload(): void }) {
  const { goBack } = useNavigation();
  const { colors } = useTheme();
  const { wallets, walletNames } = useWallets();

  const radialGradientProps = {
    center: [0, 1],
    colors: colors.gradients.lightGreyWhite,
    pointerEvents: 'none',
    style: {
      ...position.coverAsObject,
      overflow: 'hidden',
    },
  };

  const { dappName, dappUrl, dappLogo, address, chainIds } = React.useMemo(() => {
    const { namespaces, requiredNamespaces, peer } = session;
    const { metadata } = peer;
    const chains = requiredNamespaces?.eip155?.chains || [];

    const eip155Account = namespaces.eip155?.accounts?.[0] || undefined;

    if (!eip155Account) {
      const e = new RainbowError(`WalletConnectV2ListItem: unsupported namespace`);
      logger.error(e);

      // defensive, just for types, should never happen
      throw e;
    }

    const address = eip155Account?.split(':')?.[2];
    const chainIds = chains?.map(chain => parseInt(chain.split(':')[1]))?.filter(isSupportedChain) ?? [];

    if (!address) {
      const e = new RainbowError(`WalletConnectV2ListItem: could not parse address`);
      logger.error(e);

      // defensive, just for types, should never happen
      throw e;
    }

    return {
      dappName: metadata.name || 'Unknown Dapp',
      dappUrl: metadata.url || 'Unknown URL',
      dappLogo: metadata && metadata.icons ? metadata.icons[0] : undefined,
      address,
      chainIds,
    };
  }, [session]);

  const availableNetworks = useMemo(() => {
    return chainIds
      .map(network => ethereumUtils.getNetworkFromChainId(Number(network)))
      .sort(network => (network === Network.mainnet ? -1 : 1));
  }, [chainIds]);

  const approvalAccountInfo = useMemo(() => {
    const selectedWallet = findWalletWithAccount(wallets!, address);
    const approvalAccountInfo = getAccountProfileInfo(selectedWallet, walletNames, address);
    return {
      ...approvalAccountInfo,
    };
  }, [wallets, walletNames, address]);

  const handlePressChangeWallet = useCallback(() => {
    Navigation.handleAction(Routes.CHANGE_WALLET_SHEET, {
      currentAccountAddress: address,
      onChangeWallet: async (address: string) => {
        await changeAccount(session, { address });
        reload();
        goBack();
      },
      watchOnly: true,
    });
  }, [session, address, dappUrl, goBack]);

  const onPressAndroid = useCallback(() => {
    showActionSheetWithOptions(
      {
        options: androidContextMenuActions,
        showSeparators: true,
        title: dappName,
      },
      async (index: number) => {
        if (index === 0) {
          handlePressChangeWallet();
        } else if (index === 1) {
          await disconnectSession(session);
          reload();
          analytics.track('Manually disconnected from WalletConnect connection', {
            dappName,
            dappUrl,
          });
        }
      }
    );
  }, [session, address, dappName, dappUrl, handlePressChangeWallet]);

  const handleOnPressMenuItem = useCallback(
    // @ts-expect-error ContextMenu is an untyped JS component and can't type its onPress handler properly
    async ({ nativeEvent: { actionKey } }) => {
      if (actionKey === 'disconnect') {
        await disconnectSession(session);
        reload();
        analytics.track('Manually disconnected from WalletConnect connection', {
          dappName,
          dappUrl,
        });
      } else if (actionKey === 'switch-account') {
        handlePressChangeWallet();
      }
    },
    [address, dappName, dappUrl, handlePressChangeWallet]
  );

  return (
    <ContextMenuButton
      testID="wallet_connect_v2_list_item"
      menuItems={changeConnectionMenuItems({ isWalletConnectV2: true })}
      menuTitle={dappName}
      onPressAndroid={onPressAndroid}
      onPressMenuItem={handleOnPressMenuItem}
    >
      <Row align="center" height={WALLET_CONNECT_LIST_ITEM_HEIGHT}>
        <Row align="center" flex={1} style={rowStyle}>
          {/* @ts-expect-error */}
          <RequestVendorLogoIcon backgroundColor={colors.white} dappName={dappName} imageUrl={dappLogo} size={VENDOR_LOGO_ICON_SIZE} />
          <ColumnWithMargins flex={1} margin={android ? -4 : 5} style={columnStyle}>
            <Row width="95%">
              <TruncatedText size="lmedium" weight="heavy">
                {dappName || lang.t('walletconnect.unknown_application')}
              </TruncatedText>
            </Row>

            <SessionRow>
              <Centered
                style={{
                  paddingLeft: 10,
                }}
              >
                {approvalAccountInfo.accountImage ? (
                  <ImageAvatar image={approvalAccountInfo.accountImage} size="smaller" />
                ) : (
                  <ContactAvatar
                    color={isNaN(approvalAccountInfo.accountColor) ? colors.skeleton : approvalAccountInfo.accountColor}
                    size="smaller"
                    value={approvalAccountInfo.accountSymbol}
                  />
                )}
                <TruncatedText
                  size="medium"
                  style={{
                    color: colors.alpha(colors.blueGreyDark, 0.6),
                    paddingLeft: 5,
                    paddingRight: 19,
                    width: '100%',
                  }}
                  weight="bold"
                >
                  {approvalAccountInfo.accountName}
                </TruncatedText>
              </Centered>
            </SessionRow>
          </ColumnWithMargins>
          {!!availableNetworks?.length && (
            <Box borderRadius={99} paddingVertical="8px" paddingHorizontal="12px" justifyContent="center">
              <RadialGradient
                {...radialGradientProps}
                // @ts-expect-error overloaded props RadialGradient
                borderRadius={99}
                radius={600}
              />
              <Inline alignVertical="center" alignHorizontal="justify">
                <Inline alignVertical="center">
                  <Box style={{ flexDirection: 'row' }}>
                    {availableNetworks?.map((network, index) => {
                      return (
                        <Box
                          background="body (Deprecated)"
                          key={`availableNetwork-${network}`}
                          marginLeft={{ custom: index > 0 ? -4 : 0 }}
                          style={{
                            backgroundColor: colors.transparent,
                            zIndex: availableNetworks?.length - index,
                            borderRadius: 30,
                          }}
                        >
                          {network !== Network.mainnet ? (
                            <ChainBadge network={network} position="relative" size="small" />
                          ) : (
                            <EthCoinIcon size={20} />
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                </Inline>
              </Inline>
            </Box>
          )}
        </Row>
      </Row>
    </ContextMenuButton>
  );
}
