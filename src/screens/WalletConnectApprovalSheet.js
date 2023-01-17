import { useRoute } from '@react-navigation/native';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import RadialGradient from 'react-native-radial-gradient';
import { ActivityIndicator, InteractionManager } from 'react-native';
import { ContextMenuButton } from 'react-native-ios-context-menu';
import ChainLogo from '../components/ChainLogo';
import Divider from '../components/Divider';
import Spinner from '../components/Spinner';
import { Alert } from '../components/alerts';
import ButtonPressAnimation from '../components/animations/ButtonPressAnimation';
import { RequestVendorLogoIcon } from '../components/coin-icon';
import { ContactAvatar } from '../components/contacts';
import ImageAvatar from '../components/contacts/ImageAvatar';
import { Centered, Column, Flex, Row } from '../components/layout';
import {
  Sheet,
  SheetActionButton,
  SheetActionButtonRow,
} from '../components/sheet';
import { analytics } from '@/analytics';
import { getAccountProfileInfo } from '@/helpers/accountInfo';
import { getDappHostname } from '@/helpers/dappNameHandler';
import networkInfo from '@/helpers/networkInfo';
import WalletConnectApprovalSheetType from '@/helpers/walletConnectApprovalSheetTypes';
import {
  androidShowNetworksActionSheet,
  NETWORK_MENU_ACTION_KEY_FILTER,
  networksMenuItems,
} from '@/helpers/walletConnectNetworks';
import { useAccountSettings, useWallets } from '@/hooks';
import { Navigation, useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import styled from '@/styled-thing';
import { ethereumUtils } from '@/utils';
import { Network } from '@/helpers';
import { Box, Inline, Text } from '@/design-system';
import ChainBadge from '@/components/coin-icon/ChainBadge';
import { CoinIcon } from '@/components/coin-icon';
import { position } from '@/styles';
import * as lang from '@/languages';
import { ETH_ADDRESS, ETH_SYMBOL } from '@/references';
import { AssetType } from '@/entities';

const LoadingSpinner = styled(android ? Spinner : ActivityIndicator).attrs(
  ({ theme: { colors } }) => ({
    color: colors.alpha(colors.blueGreyDark, 0.3),
    size: android ? 40 : 'large',
  })
)({});

const DappLogo = styled(RequestVendorLogoIcon).attrs(
  ({ theme: { colors } }) => ({
    backgroundColor: colors.transparent,
    borderRadius: 18,
    showLargeShadow: true,
    size: 60,
  })
)({
  marginBottom: 24,
});

const AvatarWrapper = styled(Column)({
  marginRight: 5,
  marginTop: 1,
});

const LabelText = ({ children, ...props }) => {
  return (
    <Text
      color="primary (Deprecated)"
      numberOfLines={1}
      size="18px / 27px (Deprecated)"
      weight="bold"
      {...props}
    >
      {children}
    </Text>
  );
};

const SwitchText = ({ children, ...props }) => {
  return (
    <Text
      color="secondary40 (Deprecated)"
      size="14px / 19px (Deprecated)"
      weight="semibold"
      {...props}
    >
      {children}
    </Text>
  );
};

const NetworkPill = ({ chainIds }) => {
  const { colors } = useTheme();

  const radialGradientProps = {
    center: [0, 1],
    colors: colors.gradients.lightGreyWhite,
    pointerEvents: 'none',
    style: {
      ...position.coverAsObject,
      overflow: 'hidden',
    },
  };

  const availableNetworks = useMemo(() => {
    // we dont want to show mainnet
    return chainIds
      .map(network => ethereumUtils.getNetworkFromChainId(Number(network)))
      .sort(network => (network === Network.mainnet ? -1 : 1));
  }, [chainIds]);

  const networkMenuItems = useMemo(() => {
    return Object.values(networkInfo)
      .filter(
        ({ exchange_enabled, value }) =>
          exchange_enabled &&
          chainIds.includes(ethereumUtils.getChainIdFromNetwork(value))
      )
      .map(netInfo => ({
        actionKey: netInfo.value,
        actionTitle: netInfo.name,
        icon: {
          iconType: 'ASSET',
          iconValue: `${
            netInfo.layer2 ? `${netInfo.value}BadgeNoShadow` : 'ethereumBadge'
          }`,
        },
      }));
  }, [chainIds]);

  if (availableNetworks.length === 0) return null;

  return (
    <ContextMenuButton
      // @ts-expect-error overloaded props ContextMenuButton
      menuConfig={{ menuItems: networkMenuItems, menuTitle: '' }}
      isMenuPrimaryAction
      onPressMenuItem={() => {}}
      useActionSheetFallback={false}
      width="100%"
    >
      <Box
        as={ButtonPressAnimation}
        // @ts-expect-error overloaded props ButtonPressAnimation
        scaleTo={0.96}
        onPress={() => {}}
        testID={'available-networks-v2'}
      >
        <Box
          borderRadius={99}
          paddingVertical="8px"
          paddingHorizontal="12px"
          justifyContent="center"
        >
          <RadialGradient
            {...radialGradientProps}
            // @ts-expect-error overloaded props RadialGradient
            borderRadius={99}
            radius={600}
          />
          <Inline alignVertical="center" width="100%">
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
                      <ChainBadge
                        assetType={network}
                        position="relative"
                        size="small"
                      />
                    ) : (
                      <CoinIcon
                        address={ETH_ADDRESS}
                        size={20}
                        symbol={ETH_SYMBOL}
                        type={AssetType.token}
                      />
                    )}
                  </Box>
                );
              })}
            </Box>

            <Box paddingHorizontal="12px">
              <Text
                color="secondary60 (Deprecated)"
                size="14px / 19px (Deprecated)"
                weight="semibold"
                numberOfLines={2}
              >
                {lang.t(
                  availableNetworks.length > 1
                    ? lang.l.walletconnect.requesting_networks
                    : lang.l.walletconnect.requesting_network,
                  {
                    num: availableNetworks?.length,
                  }
                )}
              </Text>
            </Box>
          </Inline>
        </Box>
      </Box>
    </ContextMenuButton>
  );
};

export default function WalletConnectApprovalSheet() {
  const { colors } = useTheme();
  const { goBack } = useNavigation();
  const { params } = useRoute();
  const { network, accountAddress } = useAccountSettings();
  const { navigate } = useNavigation();
  const { selectedWallet, walletNames } = useWallets();
  const handled = useRef(false);
  const [scam, setScam] = useState(false);
  const [approvalAccount, setApprovalAccount] = useState({
    address: accountAddress,
    wallet: selectedWallet,
  });

  const type = params?.type || WalletConnectApprovalSheetType.connect;

  /**
   * CAN BE UNDEFINED if we navigated here with no data. This is how we show a
   * loading state.
   */
  const meta = params?.meta || {};
  const timeout = params?.timeout;
  const callback = params?.callback;
  const receivedTimestamp = params?.receivedTimestamp;
  const timedOut = params?.timedOut;
  const failureExplainSheetVariant = params?.failureExplainSheetVariant;
  const chainIds = meta?.chainIds; // WC v2 supports multi-chain
  const chainId = chainIds?.[0] || 1; // WC v1 only supports 1
  const currentNetwork = params?.currentNetwork;
  const [approvalNetwork, setApprovalNetwork] = useState(
    currentNetwork || network
  );
  const isWalletConnectV2 = meta.isWalletConnectV2;

  const { dappName, dappUrl, dappScheme, imageUrl, peerId } = meta;

  const checkIfScam = useCallback(
    async dappUrl => {
      const isScam = await ethereumUtils.checkIfUrlIsAScam(dappUrl);
      if (isScam) {
        Alert({
          buttons: [
            {
              text: lang.t('button.proceed_anyway'),
            },
            {
              onPress: () => setScam(true),
              style: 'cancel',
              text: lang.t('walletconnect.scam.ignore_this_request'),
            },
          ],
          message: lang.t('walletconnect.scam.we_found_this_website_in_a_list'),
          title: ` 🚨 ${lang.t('walletconnect.scam.heads_up_title')} 🚨`,
        });
      }
    },
    [setScam]
  );

  useEffect(() => {
    return () => {
      clearTimeout(timeout);
    };
  }, [timeout]);

  const formattedDappUrl = useMemo(() => {
    return getDappHostname(dappUrl);
  }, [dappUrl]);

  const approvalAccountInfo = useMemo(() => {
    const approvalAccountInfo = getAccountProfileInfo(
      approvalAccount.wallet,
      walletNames,
      approvalAccount.address
    );
    return {
      ...approvalAccountInfo,
      accountLabel:
        approvalAccountInfo.accountENS ||
        approvalAccountInfo.accountName ||
        approvalAccount.address,
    };
  }, [walletNames, approvalAccount.wallet, approvalAccount.address]);

  /**
   * In WC v1 this was the network the dapp was requesting, which was editable
   * by the end-user on this approval screen. In v2, the dapp choses one or
   * more networks and the user can't change. So this data isn't applicable in
   * v2.
   */
  const approvalNetworkInfo = useMemo(() => {
    const value = networkInfo[approvalNetwork]?.value;
    return {
      chainId: ethereumUtils.getChainIdFromNetwork(approvalNetwork),
      color: networkInfo[approvalNetwork]?.color,
      name: networkInfo[approvalNetwork]?.name,
      value,
    };
  }, [approvalNetwork]);

  const handleOnPressNetworksMenuItem = useCallback(
    ({ nativeEvent }) =>
      setApprovalNetwork(
        nativeEvent.actionKey?.replace(NETWORK_MENU_ACTION_KEY_FILTER, '')
      ),
    [setApprovalNetwork]
  );

  const handleSuccess = useCallback(
    (success = false) => {
      if (callback) {
        setTimeout(
          () =>
            callback(
              success,
              approvalNetworkInfo.chainId,
              approvalAccount.address,
              peerId,
              dappScheme,
              dappName,
              dappUrl
            ),
          300
        );
      }
    },
    [
      approvalAccount.address,
      callback,
      approvalNetworkInfo,
      peerId,
      dappScheme,
      dappName,
      dappUrl,
    ]
  );

  useEffect(() => {
    if (chainId && type === WalletConnectApprovalSheetType.connect) {
      const network = ethereumUtils.getNetworkFromChainId(Number(chainId));
      setApprovalNetwork(network);
    }
  }, [chainId, type]);

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      analytics.track('Shown Walletconnect session request');
      type === WalletConnectApprovalSheetType.connect && checkIfScam(dappUrl);
    });
    // Reject if the modal is dismissed
    return () => {
      if (!handled.current) {
        handleSuccess(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = useCallback(() => {
    handled.current = true;
    goBack();
    handleSuccess(true);
  }, [handleSuccess, goBack]);

  const handleCancel = useCallback(() => {
    handled.current = true;
    goBack();
    handleSuccess(false);
  }, [handleSuccess, goBack]);

  const onPressAndroid = useCallback(() => {
    androidShowNetworksActionSheet(({ network }) =>
      setApprovalNetwork(network)
    );
  }, []);

  const handlePressChangeWallet = useCallback(() => {
    type === WalletConnectApprovalSheetType.connect &&
      Navigation.handleAction(Routes.CHANGE_WALLET_SHEET, {
        currentAccountAddress: approvalAccount.address,
        onChangeWallet: (address, wallet) => {
          setApprovalAccount({ address, wallet });
          goBack();
        },
        watchOnly: true,
      });
  }, [approvalAccount.address, goBack, type]);

  useEffect(() => {
    const waitingTime = (Date.now() - receivedTimestamp) / 1000;
    InteractionManager.runAfterInteractions(() => {
      analytics.track('Received wc connection', {
        dappName,
        dappUrl,
        waitingTime: isNaN(waitingTime)
          ? 'Error calculating waiting time.'
          : waitingTime,
      });
    });
  }, [dappName, dappUrl, receivedTimestamp]);

  useEffect(() => {
    if (!timedOut) return;
    goBack();
    navigate(Routes.EXPLAIN_SHEET, {
      type: failureExplainSheetVariant || 'failed_wc_connection',
    });
    return;
  }, [goBack, navigate, timedOut]);

  useEffect(() => {
    if (scam) {
      handleCancel();
    }
  }, [handleCancel, scam]);

  const menuItems = useMemo(() => networksMenuItems(), []);
  const NetworkSwitcherParent =
    type === WalletConnectApprovalSheetType.connect && menuItems.length > 1
      ? ContextMenuButton
      : React.Fragment;

  const sheetHeight =
    type === WalletConnectApprovalSheetType.connect ? 408 : 438;

  return (
    <Sheet>
      {!Object.keys(meta).length ? (
        <Centered height={sheetHeight}>
          <LoadingSpinner />
        </Centered>
      ) : (
        <Flex direction="column">
          <Centered
            direction="column"
            paddingBottom={5}
            paddingHorizontal={19}
            paddingTop={17}
            testID="wc-approval-sheet"
          >
            <DappLogo dappName={dappName || ''} imageUrl={imageUrl} />
            <Centered paddingHorizontal={24}>
              <Column>
                <Row justify="center" marginBottom={12}>
                  <Text
                    align="center"
                    color="primary (Deprecated)"
                    numberOfLines={1}
                    size="23px / 27px (Deprecated)"
                    weight="heavy"
                  >
                    {dappName}
                  </Text>
                </Row>
                <Text
                  align="center"
                  color="secondary60 (Deprecated)"
                  size="23px / 27px (Deprecated)"
                  weight="semibold"
                >
                  {type === WalletConnectApprovalSheetType.connect
                    ? `wants to connect to your wallet`
                    : `wants to connect to the ${ethereumUtils.getNetworkNameFromChainId(
                        Number(chainId)
                      )} network`}
                </Text>
              </Column>
            </Centered>
            <Row marginBottom={30} marginTop={30}>
              <Text
                color="action (Deprecated)"
                size="18px / 27px (Deprecated)"
                weight="heavy"
              >
                {formattedDappUrl}
              </Text>
            </Row>
            <Divider color={colors.rowDividerLight} inset={[0, 84]} />
          </Centered>
          <SheetActionButtonRow paddingBottom={android ? 20 : 30}>
            <SheetActionButton
              color={colors.white}
              label={lang.t('button.cancel')}
              onPress={handleCancel}
              size="big"
              textColor={colors.alpha(colors.blueGreyDark, 0.8)}
              weight="bold"
            />
            <SheetActionButton
              color={colors.appleBlue}
              label={lang.t('button.connect')}
              onPress={handleConnect}
              size="big"
              testID="wc-connect"
              weight="heavy"
            />
          </SheetActionButtonRow>
          <Row justify="space-between" paddingBottom={8} paddingHorizontal={24}>
            <Column
              style={{ flex: 1, marginRight: isWalletConnectV2 ? 0 : 16 }}
            >
              <SwitchText>{lang.t('wallet.wallet_title')}</SwitchText>
              <ButtonPressAnimation
                onPress={handlePressChangeWallet}
                style={{
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  height: 38,
                }}
              >
                <Flex direction="row" align="center">
                  <AvatarWrapper>
                    {approvalAccountInfo.accountImage ? (
                      <ImageAvatar
                        image={approvalAccountInfo.accountImage}
                        size="smaller"
                      />
                    ) : (
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
                  <LabelText position="relative">
                    {approvalAccountInfo.accountLabel}
                  </LabelText>
                </Flex>
                {type === WalletConnectApprovalSheetType.connect && (
                  <LabelText> 􀁰</LabelText>
                )}
              </ButtonPressAnimation>
            </Column>
            {isWalletConnectV2 ? null : (
              <Column>
                <Flex justify="end">
                  <SwitchText align="right">
                    {lang.t('wallet.network_title')}
                  </SwitchText>
                </Flex>
                <NetworkSwitcherParent
                  activeOpacity={0}
                  isMenuPrimaryAction
                  {...(android ? { onPress: onPressAndroid } : {})}
                  menuConfig={{
                    menuItems,
                    menuTitle: lang.t('walletconnect.available_networks'),
                  }}
                  onPressMenuItem={handleOnPressNetworksMenuItem}
                  useActionSheetFallback={false}
                  wrapNativeComponent={false}
                >
                  <ButtonPressAnimation
                    style={{
                      alignItems: 'center',
                      flexDirection: 'row',
                      height: 38,
                    }}
                  >
                    <Centered marginRight={5}>
                      <ChainLogo
                        network={
                          type === WalletConnectApprovalSheetType.connect
                            ? approvalNetworkInfo.value
                            : ethereumUtils.getNetworkFromChainId(
                                Number(chainId)
                              )
                        }
                      />
                    </Centered>
                    <LabelText align="right" numberOfLines={1}>
                      {type === WalletConnectApprovalSheetType.connect
                        ? approvalNetworkInfo.name
                        : ethereumUtils.getNetworkNameFromChainId(
                            Number(chainId)
                          )}
                    </LabelText>
                    {type === WalletConnectApprovalSheetType.connect &&
                      menuItems.length > 1 && (
                        <LabelText align="right"> 􀁰</LabelText>
                      )}
                  </ButtonPressAnimation>
                </NetworkSwitcherParent>
              </Column>
            )}
          </Row>
          {isWalletConnectV2 && (
            <Row paddingBottom={21} paddingHorizontal={24}>
              <NetworkPill chainIds={chainIds} />
            </Row>
          )}
        </Flex>
      )}
    </Sheet>
  );
}
