import lang from 'i18n-js';
import React, { useCallback, useMemo } from 'react';
import RadialGradient from 'react-native-radial-gradient';
import Divider from '../Divider';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { Box, Column, Columns, Inline, Text } from '@/design-system';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { colors, position } from '@/styles';
import { watchingAlert } from '@/utils';
import { useWallets } from '@/hooks';
import { RainbowToken } from '@/entities';
import { useTheme } from '@/theme';
import { ButtonPressAnimation } from '../animations';
import { DropdownMenu, MenuItem } from '@/components/DropdownMenu';
import { implementation } from '@/entities/dispersion';
import { enableActionsOnReadOnlyWallet } from '@/config';
import { userAssetsStore } from '@/state/assets/userAssets';
import { parseSearchAsset } from '@/__swaps__/utils/assets';
import { AddressOrEth, AssetType } from '@/__swaps__/types/assets';
import { swapsStore } from '@/state/swaps/swapsStore';
import { InteractionManager } from 'react-native';
import { ChainId } from '@/state/backendNetworks/types';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

const NOOP = () => null;

const AvailableNetworksv2 = ({
  asset,
  networks,
  hideDivider = false,
  marginHorizontal = 19,
}: {
  asset: RainbowToken;
  networks: Record<number, implementation>;
  hideDivider: boolean;
  marginHorizontal: number;
}) => {
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

  const { goBack, navigate } = useNavigation();
  const { isReadOnlyWallet } = useWallets();

  const convertAssetAndNavigate = useCallback(
    (chainId: ChainId) => {
      if (isReadOnlyWallet && !enableActionsOnReadOnlyWallet) {
        watchingAlert();
        return;
      }

      const newAsset = asset;

      // we need to convert the mainnet asset to the selected network's
      newAsset.mainnet_address = networks?.[ChainId.mainnet]?.address ?? asset.address;
      newAsset.address = networks?.[chainId].address;
      newAsset.chainId = chainId;

      goBack();

      const uniqueId = `${newAsset.address}_${asset.chainId}`;
      const chainsName = useBackendNetworksStore.getState().getChainsName();
      const userAsset = userAssetsStore.getState().userAssets.get(uniqueId);

      const parsedAsset = parseSearchAsset({
        assetWithPrice: {
          ...newAsset,
          uniqueId,
          address: newAsset.address as AddressOrEth,
          type: newAsset.type as AssetType,
          chainId: asset.chainId,
          chainName: chainsName[asset.chainId],
          isNativeAsset: false,
          native: {},
        },
        searchAsset: {
          ...newAsset,
          uniqueId,
          chainId: asset.chainId,
          chainName: chainsName[asset.chainId],
          address: newAsset.address as AddressOrEth,
          highLiquidity: newAsset.highLiquidity ?? false,
          isRainbowCurated: newAsset.isRainbowCurated ?? false,
          isVerified: newAsset.isVerified ?? false,
          mainnetAddress: (newAsset.mainnet_address ?? '') as AddressOrEth,
          networks: newAsset.networks ?? [],
          type: newAsset.type as AssetType,
        },
        userAsset,
      });

      const largestBalanceSameChainUserAsset = userAssetsStore
        .getState()
        .getUserAssets()
        .find(userAsset => userAsset.chainId === asset.chainId && userAsset.address !== newAsset.address);
      if (largestBalanceSameChainUserAsset) {
        swapsStore.setState({ inputAsset: largestBalanceSameChainUserAsset });
      } else {
        swapsStore.setState({ inputAsset: null });
      }
      swapsStore.setState({ outputAsset: parsedAsset });

      InteractionManager.runAfterInteractions(() => {
        navigate(Routes.SWAP);
      });
    },
    [asset, goBack, isReadOnlyWallet, navigate, networks]
  );

  const handlePressContextMenu = useCallback((chainId: string) => convertAssetAndNavigate(+chainId), [convertAssetAndNavigate]);

  const availableChainIds = useMemo(() => {
    // we dont want to show mainnet
    return Object.keys(networks)
      .filter(chainId => Number(chainId) !== ChainId.mainnet)
      .map(chainId => Number(chainId));
  }, [networks]);

  const handlePressButton = useCallback(() => {
    convertAssetAndNavigate(availableChainIds[0]);
  }, [availableChainIds, convertAssetAndNavigate]);

  const defaultChains = useBackendNetworksStore.getState().getDefaultChains();
  const chainsLabel = useBackendNetworksStore.getState().getChainsLabel();
  const chainsBadge = useBackendNetworksStore.getState().getChainsBadge();

  const networkMenuItems: MenuItem<string>[] = useBackendNetworksStore
    .getState()
    .getSupportedChainIds()
    .filter(chainId => chainId !== ChainId.mainnet)
    .filter(chainId => availableChainIds.includes(chainId))
    .map(chainId => defaultChains[chainId])
    .map(chain => ({
      actionKey: `${chain.id}`,
      actionTitle: chainsLabel[chain.id],
      icon: {
        iconType: 'REMOTE',
        iconValue: {
          uri: chainsBadge[chain.id],
        },
      },
    }));

  const Children = useMemo(() => {
    return (
      <Box
        as={ButtonPressAnimation}
        scaleTo={0.96}
        onPress={availableChainIds.length === 1 ? handlePressButton : NOOP}
        marginHorizontal={{ custom: marginHorizontal }}
        testID={'available-networks-v2'}
      >
        <Box borderRadius={99} paddingVertical="8px" paddingHorizontal="12px" justifyContent="center" alignItems="stretch">
          <RadialGradient
            {...radialGradientProps}
            // @ts-ignore overloaded props
            borderRadius={99}
            radius={600}
          />
          <Inline alignVertical="center" alignHorizontal="justify">
            <Inline alignVertical="center">
              <Columns>
                <Column style={{ justifyContent: 'center' }} width={availableChainIds.length >= 1 ? 'content' : undefined}>
                  <Box style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                    <Box style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {availableChainIds.slice(0, 6).map((chainId, index) => {
                        return (
                          <Box
                            background="body (Deprecated)"
                            key={`availableNetwork-${chainId}`}
                            marginLeft="-4px"
                            style={{
                              backgroundColor: colors.transparent,
                              zIndex: availableChainIds?.length - index,
                              borderRadius: 30,
                            }}
                          >
                            <ChainImage chainId={chainId} position="relative" size={18} />
                          </Box>
                        );
                      })}
                    </Box>
                    {availableChainIds.length > 6 && (
                      <Text color="labelQuaternary" size="13pt" weight="bold" numberOfLines={2}>
                        +{availableChainIds.length - 6}
                      </Text>
                    )}
                  </Box>
                </Column>
                <Column style={{ justifyContent: 'center', flex: 1 }}>
                  <Box
                    style={{
                      flexDirection: 'row',
                      gap: 8,
                      alignItems: 'center',
                      justifyContent: availableChainIds.length > 1 ? 'flex-end' : 'space-between',
                    }}
                    paddingLeft="6px"
                  >
                    <Text color="labelQuaternary" size="13pt" weight="bold" numberOfLines={1} align="right">
                      {availableChainIds?.length > 1
                        ? lang.t('expanded_state.asset.available_networks', {
                            availableNetworks: availableChainIds?.length,
                          })
                        : lang.t('expanded_state.asset.available_networkv2', {
                            availableNetwork: useBackendNetworksStore.getState().getChainsLabel()[availableChainIds[0]],
                          })}
                    </Text>

                    <Text align="center" color="labelQuaternary" size="13pt" weight="bold">
                      {availableChainIds?.length > 1 ? '􀁱' : '􀯻'}
                    </Text>
                  </Box>
                </Column>
              </Columns>
            </Inline>
          </Inline>
        </Box>
      </Box>
    );
  }, [availableChainIds, colors.transparent, handlePressButton, marginHorizontal]);

  if (availableChainIds.length === 0) return null;

  if (availableChainIds.length === 1) {
    return (
      <>
        {Children}
        {hideDivider ? null : <Divider color={colors.rowDividerExtraLight} backgroundColor={undefined} />}
      </>
    );
  }

  return (
    <>
      <DropdownMenu menuConfig={{ menuItems: networkMenuItems }} onPressMenuItem={handlePressContextMenu}>
        {Children}
      </DropdownMenu>
      {hideDivider ? null : <Divider color={colors.rowDividerExtraLight} backgroundColor={undefined} />}
    </>
  );
};

export default AvailableNetworksv2;
