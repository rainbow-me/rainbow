import lang from 'i18n-js';
import React, { useCallback, useMemo } from 'react';
import RadialGradient from 'react-native-radial-gradient';
import Divider from '../Divider';
import ChainBadge from '../coin-icon/ChainBadge';
import { Box, Inline, Text } from '@/design-system';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { position } from '@/styles';
import { ethereumUtils, watchingAlert } from '@/utils';
import { CurrencySelectionTypes, ExchangeModalTypes, Network } from '@/helpers';
import { useSwapCurrencyHandlers, useWallets } from '@/hooks';
import { RainbowToken } from '@/entities';
import { useTheme } from '@/theme';
import { ButtonPressAnimation } from '../animations';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { implementation } from '@/entities/dispersion';
import { RainbowNetworks, getNetworkObj } from '@/networks';
import { EthCoinIcon } from '../coin-icon/EthCoinIcon';
import { SWAPS_V2, enableActionsOnReadOnlyWallet, useExperimentalFlag } from '@/config';
import { useRemoteConfig } from '@/model/remoteConfig';
import { userAssetsStore } from '@/state/assets/userAssets';
import { parseSearchAsset } from '@/__swaps__/utils/assets';
import { AddressOrEth, AssetType } from '@/__swaps__/types/assets';
import { chainNameFromChainId } from '@/__swaps__/utils/chains';
import { swapsStore } from '@/state/swaps/swapsStore';
import { InteractionManager } from 'react-native';

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
  const { swaps_v2 } = useRemoteConfig();
  const swapsV2Enabled = useExperimentalFlag(SWAPS_V2);
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

  const availableNetworks = useMemo(() => {
    // we dont want to show mainnet
    return Object.keys(networks)
      .map(network => ethereumUtils.getNetworkFromChainId(Number(network)))
      .filter(network => network !== Network.mainnet);
  }, [networks]);

  const { updateInputCurrency } = useSwapCurrencyHandlers({
    shouldUpdate: true,
    type: ExchangeModalTypes.swap,
  });
  const convertAssetAndNavigate = useCallback(
    (chosenNetwork: Network) => {
      if (isReadOnlyWallet && !enableActionsOnReadOnlyWallet) {
        watchingAlert();
        return;
      }

      const newAsset = asset;

      // we need to convert the mainnet asset to the selected network's
      newAsset.mainnet_address = networks?.[ethereumUtils.getChainIdFromNetwork(Network.mainnet)]?.address ?? asset.address;
      newAsset.address = networks?.[ethereumUtils.getChainIdFromNetwork(chosenNetwork)].address;
      newAsset.network = chosenNetwork;

      goBack();

      if (swapsV2Enabled || swaps_v2) {
        const chainId = ethereumUtils.getChainIdFromNetwork(newAsset.network);
        const uniqueId = `${newAsset.address}_${chainId}`;
        const userAsset = userAssetsStore.getState().userAssets.get(uniqueId);

        const parsedAsset = parseSearchAsset({
          assetWithPrice: {
            ...newAsset,
            uniqueId,
            address: newAsset.address as AddressOrEth,
            type: newAsset.type as AssetType,
            chainId,
            chainName: chainNameFromChainId(chainId),
            isNativeAsset: false,
            native: {},
          },
          searchAsset: {
            ...newAsset,
            uniqueId,
            chainId,
            chainName: chainNameFromChainId(chainId),
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
          .find(userAsset => userAsset.chainId === chainId && userAsset.address !== newAsset.address);
        if (largestBalanceSameChainUserAsset) {
          swapsStore.setState({ inputAsset: largestBalanceSameChainUserAsset });
        } else {
          swapsStore.setState({ inputAsset: null });
        }
        swapsStore.setState({ outputAsset: parsedAsset });

        InteractionManager.runAfterInteractions(() => {
          navigate(Routes.SWAP);
        });

        return;
      }

      newAsset.uniqueId = `${asset.address}_${chosenNetwork}`;
      newAsset.type = chosenNetwork;

      navigate(Routes.EXCHANGE_MODAL, {
        params: {
          fromDiscover: true,
          ignoreInitialTypeCheck: true,
          defaultOutputAsset: newAsset,
          type: CurrencySelectionTypes.input,
          showCoinIcon: true,
          title: lang.t('swap.modal_types.get_symbol_with', {
            symbol: newAsset?.symbol,
          }),
          onSelectCurrency: updateInputCurrency,
        },
        screen: Routes.CURRENCY_SELECT_SCREEN,
      });
    },
    [asset, goBack, navigate, networks, swapsV2Enabled, swaps_v2, updateInputCurrency]
  );

  const handlePressContextMenu = useCallback(
    // @ts-expect-error ContextMenu is an untyped JS component and can't type its onPress handler properly
    ({ nativeEvent: { actionKey: network } }) => {
      convertAssetAndNavigate(network);
    },
    [convertAssetAndNavigate]
  );

  const handlePressButton = useCallback(() => {
    convertAssetAndNavigate(availableNetworks[0]);
  }, [availableNetworks, convertAssetAndNavigate]);

  const networkMenuItems = useMemo(() => {
    return RainbowNetworks.filter(({ features, value, id }) => features.swaps && value !== Network.mainnet && !!networks[id]).map(
      network => ({
        actionKey: network.value,
        actionTitle: network.name,
        icon: {
          iconType: 'ASSET',
          iconValue: `${network.networkType === 'layer2' ? `${network.value}BadgeNoShadow` : 'ethereumBadge'}`,
        },
      })
    );
  }, [networks]);

  const MenuWrapper = availableNetworks.length > 1 ? ContextMenuButton : Box;

  if (availableNetworks.length === 0) return null;
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
          onPress={availableNetworks.length === 1 ? handlePressButton : NOOP}
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
                  {availableNetworks?.map((network, index) => {
                    return (
                      <Box
                        background="body (Deprecated)"
                        key={`availableNetwork-${network}`}
                        marginLeft="-4px"
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

                <Box paddingLeft="6px">
                  <Text color="secondary60 (Deprecated)" size="14px / 19px (Deprecated)" weight="semibold" numberOfLines={2}>
                    {availableNetworks?.length > 1
                      ? lang.t('expanded_state.asset.available_networks', {
                          availableNetworks: availableNetworks?.length,
                        })
                      : lang.t('expanded_state.asset.available_networkv2', {
                          availableNetwork: getNetworkObj(availableNetworks?.[0])?.name,
                        })}
                  </Text>
                </Box>
              </Inline>
              <Text align="center" color="secondary40 (Deprecated)" size="14px / 19px (Deprecated)" weight="semibold">
                {availableNetworks?.length > 1 ? '􀁱' : '􀯻'}
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
