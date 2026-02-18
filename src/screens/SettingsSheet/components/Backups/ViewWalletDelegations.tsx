import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { useNavigation } from '@/navigation';
import { StyleSheet, Text as NativeText } from 'react-native';
import { Box, Separator, Stack, Text } from '@/design-system';
import * as i18n from '@/languages';
import Routes from '@/navigation/routesNames';
import Menu from '../Menu';
import MenuContainer from '../MenuContainer';
import MenuItem from '../MenuItem';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import { ChainId } from '@/state/backendNetworks/types';
import { fonts } from '@/design-system/typography/typography';
import { useTheme } from '@/theme';
import LinearGradient from 'react-native-linear-gradient';
import { ContextCircleButton } from '@/components/context-menu';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { IS_IOS } from '@/env';
import * as ethereumUtils from '@/utils/ethereumUtils';
import { formatAddressForDisplay } from '@/utils/abbreviations';
import { DelegationStatus, useDelegationPreference, useDelegations } from '@rainbow-me/delegation';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import type { Address } from 'viem';
import { RevokeReason } from '@/screens/delegation/RevokeDelegationPanel';

type ViewWalletDelegationsParams = {
  ViewWalletDelegations: { walletId: string; address: Address; title: string };
};

const enum NetworkMenuAction {
  RevokeDelegation = 'revoke_delegation',
  ViewOnExplorer = 'view_on_explorer',
}

type NetworkMenuEvent = {
  nativeEvent: {
    actionKey: NetworkMenuAction;
  };
  chainId: ChainId;
};

type SmartWalletStatus = 'active' | 'disabled';

type SmartWalletStatusBadgeProps = {
  status: SmartWalletStatus;
  text: string;
};

const SmartWalletStatusBadge = ({ status, text }: SmartWalletStatusBadgeProps) => {
  const isActive = status === 'active';
  const { colors } = useTheme();

  const labelColor = isActive ? 'rgba(245, 248, 255, 0.76)' : 'rgba(245, 248, 255, 0.56)';

  return (
    <GradientBorderView
      borderGradientColors={['rgba(59, 127, 255, 0.16)', 'rgba(183, 36, 173, 0.16)', 'rgba(25, 0, 45, 0.16)']}
      borderWidth={1.667}
      borderRadius={40}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      backgroundColor="transparent"
    >
      <Box paddingLeft={{ custom: 9 }} paddingRight={{ custom: 5.5 }} paddingVertical={{ custom: 7 }}>
        <Box flexDirection="row" alignItems="center" gap={4}>
          <NativeText
            allowFontScaling={false}
            numberOfLines={1}
            style={{
              color: labelColor,
              fontFamily: fonts.SFProRounded.heavy.fontFamily,
              fontWeight: fonts.SFProRounded.heavy.fontWeight,
              fontSize: 13,
              letterSpacing: 0.51,
              lineHeight: 13,
              includeFontPadding: false,
              top: 1,
            }}
          >
            {text}
          </NativeText>
          <Box
            width={{ custom: 16 }}
            height={{ custom: 16 }}
            borderRadius={14}
            borderWidth={1.333}
            borderColor={{ custom: 'rgba(255, 255, 255, 0.15)' }}
            backgroundColor={isActive ? '#1DB847' : colors.brightRed}
            alignItems="center"
            justifyContent="center"
          >
            <Text color="white" size="icon 8px" weight="black">
              {isActive ? '􀆅' : '􀆄'}
            </Text>
          </Box>
        </Box>
      </Box>
    </GradientBorderView>
  );
};

const ViewWalletDelegations = () => {
  const { params } = useRoute<RouteProp<ViewWalletDelegationsParams, typeof Routes.VIEW_WALLET_DELEGATIONS>>();
  const { address } = params;

  const { navigate } = useNavigation();

  const getChainsLabel = useBackendNetworksStore(state => state.getChainsLabel);

  // Get delegations from SDK store (reactive)
  const { delegations = [] } = useDelegations(address);

  // Get chain labels for display
  const chainsLabel = getChainsLabel();
  const getChainName = (chainId: number) => chainsLabel[chainId as ChainId] || `Chain ${chainId}`;

  // Get delegation preference from SDK store (reactive)
  const { enabled: isSmartWalletEnabled = true, setEnabled } = useDelegationPreference(address) ?? {};

  const activatedNetworks = delegations.filter(d => d.delegationStatus === DelegationStatus.RAINBOW_DELEGATED);

  const inactiveNetworks = delegations.filter(d => d.delegationStatus === DelegationStatus.THIRD_PARTY_DELEGATED);

  const handleRevokeDelegation = useCallback(
    (chainId: ChainId, revokeReason: RevokeReason) => {
      const delegation = delegations.find(d => d.chainId === chainId);
      if (!delegation) return;

      // Use currentContract for Rainbow delegations, revokeAddress for third-party delegations
      const contractAddress = delegation.currentContract || delegation.revokeAddress;
      if (!contractAddress) return;

      navigate(Routes.REVOKE_DELEGATION_PANEL, {
        delegationsToRevoke: [
          {
            chainId,
            contractAddress,
          },
        ],
        revokeReason,
      });
    },
    [delegations, navigate]
  );

  const handleViewOnExplorer = useCallback(
    (chainId: ChainId) => {
      ethereumUtils.default.openAddressInBlockExplorer({ address, chainId });
    },
    [address]
  );

  const handleToggleSmartWallet = useCallback(() => {
    if (isSmartWalletEnabled) {
      // Disabling smart wallet - revoke all active delegations
      const delegationsToRevoke = activatedNetworks
        .filter(network => network.currentContract)
        .map(network => ({
          chainId: network.chainId,
          contractAddress: network.currentContract!,
        }));

      if (delegationsToRevoke.length > 0) {
        // Navigate to revoke panel with callback to disable preference after success
        navigate(Routes.REVOKE_DELEGATION_PANEL, {
          delegationsToRevoke,
          revokeReason: RevokeReason.DISABLE_SMART_WALLET,
          onSuccess: () => {
            // Set delegation preference to disabled after successful revocation
            setEnabled?.(false);
          },
        });
      } else {
        // No active delegations to revoke, just disable the preference
        setEnabled?.(false);
      }
    } else {
      // Enabling smart wallet - set preference to enabled
      setEnabled?.(true);
    }
  }, [isSmartWalletEnabled, activatedNetworks, navigate, setEnabled]);

  const activeNetworkMenuConfig = {
    menuTitle: '',
    menuItems: [
      {
        actionKey: NetworkMenuAction.RevokeDelegation,
        actionTitle: 'Disable Account',
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'xmark.circle',
        },
      },
    ],
  };

  const inactiveNetworkMenuConfig = {
    menuTitle: '',
    menuItems: [
      {
        actionKey: NetworkMenuAction.RevokeDelegation,
        actionTitle: 'Disable Account',
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'xmark.circle',
        },
      },
      {
        // TODO: Add correct explorer label
        actionKey: NetworkMenuAction.ViewOnExplorer,
        actionTitle: 'View on Explorer',
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'arrow.up.forward.square',
        },
      },
    ],
  };

  const onPressNetworkMenuItem = useCallback(
    ({ nativeEvent: { actionKey }, chainId }: NetworkMenuEvent) => {
      switch (actionKey) {
        case NetworkMenuAction.RevokeDelegation: {
          // Determine the correct reason based on delegation status
          const delegation = delegations.find(d => d.chainId === chainId);
          const revokeReason =
            delegation?.delegationStatus === DelegationStatus.THIRD_PARTY_DELEGATED
              ? RevokeReason.DISABLE_THIRD_PARTY
              : RevokeReason.DISABLE_SINGLE_NETWORK;
          handleRevokeDelegation(chainId, revokeReason);
          break;
        }
        case NetworkMenuAction.ViewOnExplorer:
          handleViewOnExplorer(chainId);
          break;
        default:
          break;
      }
    },
    [delegations, handleRevokeDelegation, handleViewOnExplorer]
  );

  return (
    <MenuContainer>
      <Stack space="20px">
        {/* Smart Wallet Status Card */}
        <Box>
          <Menu>
            <Box borderRadius={24} shadow="18px" background="surfaceSecondary">
              <GradientBorderView
                borderGradientColors={['rgba(59, 127, 255, 0.16)', 'rgba(183, 36, 173, 0.16)', 'rgba(25, 0, 45, 0.16)']}
                borderWidth={1.667}
                borderRadius={24}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* Background Gradient */}
                <Box
                  as={LinearGradient}
                  colors={['rgba(0, 68, 195, 0.2)', 'rgba(87, 0, 81, 0.2)', 'rgba(25, 0, 45, 0.2)', 'rgba(0, 0, 0, 0.2)']}
                  locations={[0.096, 0.54, 0.82, 1]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />

                {/* Content */}
                <Box paddingVertical="20px" paddingHorizontal="36px">
                  <Stack space="12px" alignHorizontal="center">
                    {/* Lock Icon with Gradient */}
                    <Box
                      width={{ custom: 36 }}
                      height={{ custom: 36 }}
                      borderRadius={12}
                      borderWidth={1.333}
                      borderColor={{ custom: 'rgba(255, 255, 255, 0.1)' }}
                    >
                      <LinearGradient
                        colors={['#3b7fff', '#b724ad', '#19002d']}
                        locations={[0.043, 0.887, 1]}
                        useAngle
                        angle={132.532}
                        angleCenter={{ x: 0.5, y: 0.5 }}
                        style={StyleSheet.absoluteFill}
                      />
                      <Box alignItems="center" justifyContent="center" width="full" height="full">
                        <Text
                          color="white"
                          size="20pt"
                          weight="heavy"
                          align="center"
                          style={{
                            textShadowColor: 'rgba(0, 0, 0, 0.15)',
                            textShadowOffset: { width: 0, height: 1.5 },
                            textShadowRadius: 4,
                          }}
                        >
                          􀎡
                        </Text>
                      </Box>
                    </Box>

                    {/* Title */}
                    <Text color="label" size="20pt" weight="heavy" align="center">
                      {i18n.t(i18n.l.wallet.delegations.smart_wallet)}
                    </Text>

                    {/* Status Badge */}
                    <SmartWalletStatusBadge
                      status={isSmartWalletEnabled ? 'active' : 'disabled'}
                      text={i18n.t(isSmartWalletEnabled ? i18n.l.wallet.delegations.active : i18n.l.wallet.delegations.not_active)}
                    />

                    {/* Description */}
                    <Box width={{ custom: 288 }}>
                      <Text color="labelQuaternary" size="13pt" weight="semibold" align="center" style={{ lineHeight: 17.55 }}>
                        {i18n.t(i18n.l.wallet.delegations.smart_wallet_description)}
                      </Text>
                    </Box>
                  </Stack>
                </Box>
              </GradientBorderView>
            </Box>
          </Menu>
        </Box>

        {/* Activated Networks Section */}
        {activatedNetworks.length > 0 && (
          <>
            {/* Separator */}
            <Box paddingHorizontal="8px">
              <Separator color="separatorTertiary" thickness={1} />
            </Box>

            <Box>
              <Stack space="20px">
                {/* Section Header */}
                <Box paddingHorizontal="10px">
                  <Text color="labelSecondary" size="15pt" weight="bold">
                    {i18n.t(i18n.l.wallet.delegations.activated_networks)}
                  </Text>
                </Box>

                {/* Networks List */}
                <Menu>
                  {activatedNetworks.map((network, index) => {
                    const NetworkContextMenuWrapper = ({ children }: { children: React.ReactNode }) => {
                      return IS_IOS ? (
                        <ContextMenuButton
                          menuConfig={activeNetworkMenuConfig}
                          onPressMenuItem={e => onPressNetworkMenuItem({ ...e, chainId: network.chainId })}
                        >
                          {children}
                        </ContextMenuButton>
                      ) : (
                        <ContextCircleButton
                          options={activeNetworkMenuConfig.menuItems.map(item => item.actionTitle)}
                          onPressActionSheet={(buttonIndex: number) => {
                            const actionKey = activeNetworkMenuConfig.menuItems[buttonIndex].actionKey;
                            onPressNetworkMenuItem({ nativeEvent: { actionKey }, chainId: network.chainId });
                          }}
                        >
                          {children}
                        </ContextCircleButton>
                      );
                    };

                    return (
                      <React.Fragment key={network.chainId}>
                        <NetworkContextMenuWrapper>
                          <MenuItem
                            size={52}
                            disabled
                            leftComponent={
                              <Box width={{ custom: 28 }} height={{ custom: 28 }}>
                                <ChainImage chainId={network.chainId} size={28} position="relative" />
                              </Box>
                            }
                            titleComponent={<MenuItem.Title text={getChainName(network.chainId)} weight="bold" />}
                            rightComponent={
                              <Text color="labelQuinary" size="17pt" weight="bold">
                                􀍡
                              </Text>
                            }
                          />
                        </NetworkContextMenuWrapper>
                        {index < activatedNetworks.length - 1 && (
                          <Box paddingHorizontal="16px">
                            <Separator color="separatorTertiary" thickness={1} />
                          </Box>
                        )}
                      </React.Fragment>
                    );
                  })}
                </Menu>
              </Stack>
            </Box>
          </>
        )}

        {/* Other Smart Accounts Section */}
        {inactiveNetworks.length > 0 && (
          <>
            {/* Separator */}
            <Box paddingHorizontal="8px">
              <Separator color="separatorTertiary" thickness={1} />
            </Box>

            <Box>
              <Stack space="20px">
                {/* Section Header */}
                <Box paddingHorizontal="10px">
                  <Text color="labelSecondary" size="15pt" weight="bold">
                    {i18n.t(i18n.l.wallet.delegations.other_smart_accounts)}
                  </Text>
                </Box>

                {/* Other Smart Accounts List */}
                <Menu>
                  {inactiveNetworks.map((network, index) => {
                    const NetworkContextMenuWrapper = ({ children }: { children: React.ReactNode }) => {
                      return IS_IOS ? (
                        <ContextMenuButton
                          menuConfig={inactiveNetworkMenuConfig}
                          onPressMenuItem={e => onPressNetworkMenuItem({ ...e, chainId: network.chainId })}
                        >
                          {children}
                        </ContextMenuButton>
                      ) : (
                        <ContextCircleButton
                          options={inactiveNetworkMenuConfig.menuItems.map(item => item.actionTitle)}
                          onPressActionSheet={(buttonIndex: number) => {
                            const actionKey = inactiveNetworkMenuConfig.menuItems[buttonIndex].actionKey;
                            onPressNetworkMenuItem({ nativeEvent: { actionKey }, chainId: network.chainId });
                          }}
                        >
                          {children}
                        </ContextCircleButton>
                      );
                    };

                    return (
                      <React.Fragment key={network.chainId}>
                        <NetworkContextMenuWrapper>
                          <MenuItem
                            size={60}
                            disabled
                            leftComponent={
                              <Box width={{ custom: 28 }} height={{ custom: 28 }}>
                                <ChainImage chainId={network.chainId} size={28} position="relative" />
                              </Box>
                            }
                            titleComponent={<MenuItem.Title text={getChainName(network.chainId)} weight="bold" />}
                            labelComponent={(() => {
                              const contractAddress = network.currentContract || network.revokeAddress;
                              if (contractAddress) {
                                return (
                                  <MenuItem.Label
                                    text={i18n.t(i18n.l.wallet.delegations.delegated_to, {
                                      name: network.currentContractName || formatAddressForDisplay(contractAddress),
                                    })}
                                  />
                                );
                              }
                              // Fallback for third-party delegations where contract address isn't provided
                              return <MenuItem.Label text={i18n.t(i18n.l.wallet.delegations.delegated_to_another_wallet)} />;
                            })()}
                            rightComponent={
                              <Text color="labelQuinary" size="17pt" weight="bold">
                                􀍡
                              </Text>
                            }
                          />
                        </NetworkContextMenuWrapper>
                        {index < inactiveNetworks.length - 1 && (
                          <Box paddingHorizontal="16px">
                            <Separator color="separatorTertiary" thickness={1} />
                          </Box>
                        )}
                      </React.Fragment>
                    );
                  })}
                </Menu>
              </Stack>
            </Box>
          </>
        )}

        {/* Separator */}
        <Box paddingHorizontal="8px">
          <Separator color="separatorTertiary" thickness={1} />
        </Box>

        {/* Toggle Smart Wallet Button */}
        <Box>
          <Menu
            description={
              <Text color="labelSecondary" size="13pt" weight="medium">
                {i18n.t(
                  isSmartWalletEnabled ? i18n.l.wallet.delegations.enabled_description : i18n.l.wallet.delegations.disabled_description
                )}
              </Text>
            }
          >
            <MenuItem
              size={52}
              hasSfSymbol
              onPress={handleToggleSmartWallet}
              leftComponent={<MenuItem.TextIcon icon={isSmartWalletEnabled ? '􀎽' : '􀁍'} isLink />}
              titleComponent={
                <MenuItem.Title
                  text={i18n.t(
                    isSmartWalletEnabled ? i18n.l.wallet.delegations.disable_smart_wallet : i18n.l.wallet.delegations.enable_smart_wallet
                  )}
                  isLink
                />
              }
            />
          </Menu>
        </Box>
      </Stack>
    </MenuContainer>
  );
};

export default ViewWalletDelegations;
