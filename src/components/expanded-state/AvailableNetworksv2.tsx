import lang from 'i18n-js';
import React, { useCallback, useMemo } from 'react';
import RadialGradient from 'react-native-radial-gradient';
import Divider from '../Divider';
import ChainBadge from '../coin-icon/ChainBadge';
import { Box, Inline, Text } from '@/design-system';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { position } from '@/styles';
import { watchingAlert } from '@/utils';
import { useWallets } from '@/hooks';
import { RainbowToken } from '@/entities';
import { useTheme } from '@/theme';
import { ButtonPressAnimation } from '../animations';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { implementation } from '@/entities/dispersion';
import { EthCoinIcon } from '../coin-icon/EthCoinIcon';
import { enableActionsOnReadOnlyWallet } from '@/config';
import { userAssetsStore } from '@/state/assets/userAssets';
import { parseSearchAsset } from '@/__swaps__/utils/assets';
import { AddressOrEth, AssetType } from '@/__swaps__/types/assets';
import { swapsStore } from '@/state/swaps/swapsStore';
import { InteractionManager } from 'react-native';
import { ChainId } from '@/chains/types';
import { chainsLabel, chainsName, defaultChains, supportedSwapChainIds } from '@/chains';

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
  const { goBack, navigate } = useNavigation();
  const { isReadOnlyWallet } = useWallets();

  const radialGradientProps = {
    center: [0, 1],
    colors: colors.gradients.lightGreyWhite,
    pointerEvents: 'none',
    style: {
      ...position.coverAsObject,
      overflow: 'hidden',
    },
  };

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

  const handlePressContextMenu = useCallback(
    // @ts-expect-error ContextMenu is an untyped JS component and can't type its onPress handler properly
    ({ nativeEvent: { actionKey: chainId } }) => {
      convertAssetAndNavigate(chainId);
    },
    [convertAssetAndNavigate]
  );

  const availableChainIds = useMemo(() => {
    // we dont want to show mainnet
    return Object.keys(networks)
      .filter(chainId => Number(chainId) !== ChainId.mainnet)
      .map(chainId => Number(chainId));
  }, [networks]);

  const handlePressButton = useCallback(() => {
    convertAssetAndNavigate(availableChainIds[0]);
  }, [availableChainIds, convertAssetAndNavigate]);

  const networkMenuItems = supportedSwapChainIds
    .filter(chainId => chainId !== ChainId.mainnet && availableChainIds.includes(chainId))
    .map(chainId => defaultChains[chainId])
    .map(chain => ({
      actionKey: `${chain.id}`,
      actionTitle: chainsLabel[chain.id],
      icon: {
        iconType: 'ASSET',
        iconValue: `${chainsName[chain.id]}Badge${chain.id === ChainId.mainnet ? '' : 'NoShadow'}`,
      },
    }));

  const MenuWrapper = availableChainIds.length > 1 ? ContextMenuButton : Box;

  if (availableChainIds.length === 0) return null;
  return (
    <>
      <MenuWrapper
        // @ts-ignore overloaded props
        menuConfig={{ menuItems: networkMenuItems, menuTitle: '' }}
        isMenuPrimaryAction
        onPressMenuItem={handlePressContextMenu}
        useActionSheetFallback={false}
      >
        <Box
          as={ButtonPressAnimation}
          scaleTo={0.96}
          onPress={availableChainIds.length === 1 ? handlePressButton : NOOP}
          marginHorizontal={{ custom: marginHorizontal }}
          testID={'available-networks-v2'}
        >
          <Box borderRadius={99} paddingVertical="8px" paddingHorizontal="12px" justifyContent="center">
            <RadialGradient
              {...radialGradientProps}
              // @ts-ignore overloaded props
              borderRadius={99}
              radius={600}
            />
            <Inline alignVertical="center" alignHorizontal="justify">
              <Inline alignVertical="center">
                <Box style={{ flexDirection: 'row' }}>
                  {availableChainIds?.map((chainId, index) => {
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
                        {chainId !== ChainId.mainnet ? (
                          <ChainBadge chainId={chainId} position="relative" size="small" />
                        ) : (
                          <EthCoinIcon size={20} />
                        )}
                      </Box>
                    );
                  })}
                </Box>

                <Box paddingLeft="6px">
                  <Text color="secondary60 (Deprecated)" size="14px / 19px (Deprecated)" weight="semibold" numberOfLines={2}>
                    {availableChainIds?.length > 1
                      ? lang.t('expanded_state.asset.available_networks', {
                          availableNetworks: availableChainIds?.length,
                        })
                      : lang.t('expanded_state.asset.available_networkv2', {
                          availableNetwork: chainsName[availableChainIds[0]],
                        })}
                  </Text>
                </Box>
              </Inline>
              <Text align="center" color="secondary40 (Deprecated)" size="14px / 19px (Deprecated)" weight="semibold">
                {availableChainIds?.length > 1 ? '􀁱' : '􀯻'}
              </Text>
            </Inline>
          </Box>
        </Box>
      </MenuWrapper>
      {hideDivider ? null : <Divider color={colors.rowDividerExtraLight} backgroundColor={undefined} />}
    </>
  );
};

export default AvailableNetworksv2;
