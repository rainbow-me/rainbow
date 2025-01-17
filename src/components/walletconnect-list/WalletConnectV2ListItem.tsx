import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { showActionSheetWithOptions } from '@/utils';
import * as lang from '@/languages';
import { useTheme } from '@/theme';
import { changeAccount, disconnectSession } from '@/walletConnect';
import { Box, Inline } from '@/design-system';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { ChainId } from '@/state/backendNetworks/types';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

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

  const [address, setAddress] = useState<string | undefined>(undefined);
  const [accountInfo, setAccountInfo] = useState<ReturnType<typeof getAccountProfileInfo> | undefined>(undefined);

  const radialGradientProps = {
    center: [0, 1],
    colors: colors.gradients.lightGreyWhite,
    pointerEvents: 'none',
    style: {
      ...position.coverAsObject,
      overflow: 'hidden',
    },
  };

  const { namespaces, peer } = session;
  const { metadata } = peer;

  useEffect(() => {
    const eip155Account = session.namespaces.eip155?.accounts?.[0] || undefined;
    const address = eip155Account?.split(':')?.[2];
    setAddress(address);
  }, [session]);

  useEffect(() => {
    if (address) {
      setAccountInfo(getAccountProfileInfo(findWalletWithAccount(wallets || {}, address), walletNames, address));
    }
  }, [address, walletNames, wallets]);

  const chains = useMemo(() => namespaces?.eip155?.chains || [], [namespaces]);
  const chainIds = useMemo(
    () =>
      chains
        ?.map(chain => parseInt(chain.split(':')[1]))
        ?.filter(chainId => useBackendNetworksStore.getState().getSupportedChainIds().includes(chainId)) ?? [],
    [chains]
  );

  const dappName = metadata.name || 'Unknown Dapp';
  const dappUrl = metadata.url || 'Unknown URL';
  const dappLogo = metadata && metadata.icons ? metadata.icons[0] : undefined;

  const availableNetworksChainIds = useMemo(() => chainIds.sort(chainId => (chainId === ChainId.mainnet ? -1 : 1)), [chainIds]);

  const handlePressChangeWallet = useCallback(() => {
    Navigation.handleAction(Routes.CHANGE_WALLET_SHEET, {
      currentAccountAddress: address,
      onChangeWallet: async (address: string) => {
        const success = await changeAccount(session, { address });
        if (success) {
          setAddress(address);
          reload();
        }
        goBack();
      },
      watchOnly: true,
    });
  }, [address, session, goBack, reload]);

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
  }, [dappName, handlePressChangeWallet, session, reload, dappUrl]);

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
    [dappName, dappUrl, handlePressChangeWallet, reload, session]
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
                {accountInfo?.accountImage ? (
                  <ImageAvatar image={accountInfo.accountImage} size="smaller" />
                ) : (
                  <ContactAvatar
                    color={isNaN(accountInfo?.accountColor ?? 0) ? colors.skeleton : accountInfo?.accountColor}
                    size="smaller"
                    value={accountInfo?.accountSymbol}
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
                  {accountInfo?.accountName}
                </TruncatedText>
              </Centered>
            </SessionRow>
          </ColumnWithMargins>
          {!!availableNetworksChainIds?.length && (
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
                    {availableNetworksChainIds?.map((chainId, index) => {
                      return (
                        <Box
                          background="body (Deprecated)"
                          key={`availableNetwork-${chainId}`}
                          marginLeft={{ custom: index > 0 ? -4 : 0 }}
                          style={{
                            backgroundColor: colors.transparent,
                            zIndex: availableNetworksChainIds?.length - index,
                            borderRadius: 30,
                          }}
                        >
                          <ChainImage chainId={chainId} size={20} position="relative" />
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
