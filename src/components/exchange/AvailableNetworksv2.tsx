import lang from 'i18n-js';
import React, { useCallback, useMemo } from 'react';
import RadialGradient from 'react-native-radial-gradient';
import Divider from '../Divider';
import { CoinIcon } from '../coin-icon';
import ChainBadge from '../coin-icon/ChainBadge';
import { Box, Inline, Text } from '@/design-system';
import networkInfo from '@/helpers/networkInfo';
import { useNavigation } from '@/navigation';
import { ETH_ADDRESS, ETH_SYMBOL } from '@/references';
import Routes from '@/navigation/routesNames';
import { position } from '@/styles';
import { ethereumUtils } from '@/utils';
import { ContextMenuButton } from '../context-menu';
import { CurrencySelectionTypes, ExchangeModalTypes, Network } from '@/helpers';
import { useSwapCurrencyHandlers } from '@/hooks';
import { AssetType, RainbowToken } from '@/entities';
import { useTheme } from '@/theme';
import { EthereumAddress } from '@rainbow-me/swaps';
import { ButtonPressAnimation } from '../animations';

type implementation = { address: EthereumAddress; decimals: number };

const AvailableNetworksv2 = ({
  asset,
  networks,
  hideDivider,
  marginHorizontal = 19,
}: {
  asset: RainbowToken;
  networks: Record<number, implementation>;
  hideDivider: boolean;
  marginHorizontal: number;
}) => {
  const { colors } = useTheme();
  const { goBack, navigate } = useNavigation();

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
    let newNetworks = networks;
    delete newNetworks['1'];
    return Object.keys(newNetworks).map(network =>
      ethereumUtils.getNetworkFromChainId(Number(network))
    );
  }, [networks]);

  const { updateInputCurrency } = useSwapCurrencyHandlers({
    shouldUpdate: true,
    type: ExchangeModalTypes.swap,
  });

  const handleAvailableNetworksPress = useCallback(
    ({ nativeEvent: { actionKey: network } }) => {
      const chosenNetwork = network ?? availableNetworks[0];
      const newAsset = asset;

      // we need to convert the mainnet asset to the selected network's
      newAsset.mainnet_address =
        networks?.[ethereumUtils.getChainIdFromNetwork(Network.mainnet)]
          ?.address ?? asset.address;
      newAsset.address =
        networks?.[ethereumUtils.getChainIdFromNetwork(chosenNetwork)].address;
      newAsset.uniqueId = `${asset.address}_${chosenNetwork}`;
      newAsset.type = chosenNetwork;

      goBack();
      navigate(Routes.EXCHANGE_MODAL, {
        chainId: ethereumUtils.getChainIdFromNetwork(chosenNetwork),
        defaultOutputAsset: newAsset,
        fromDiscover: true,
        onSelectCurrency: updateInputCurrency,
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
        type: CurrencySelectionTypes.input,
        screen: Routes.CURRENCY_SELECT_SCREEN,
      });
    },
    [availableNetworks, asset, networks, goBack, navigate, updateInputCurrency]
  );

  const networkMenuConfig = () => {
    return Object.values(networkInfo)
      .filter(
        ({ exchange_enabled, value }) =>
          exchange_enabled &&
          value !== Network.mainnet &&
          !!networks[ethereumUtils.getChainIdFromNetwork(value)]
      )
      .map(netInfo => ({
        actionKey: netInfo.value,
        actionTitle: netInfo.longName || netInfo.name,
        icon: {
          iconType: 'ASSET',
          iconValue: `${
            netInfo.layer2 ? `${netInfo.value}BadgeNoShadow` : 'ethereumBadge'
          }`,
        },
      }));
  };

  console.log(availableNetworks);
  const Button =
    availableNetworks.length > 1 ? ContextMenuButton : ButtonPressAnimation;

  return (
    <>
      <Button
        menuItems={networkMenuConfig()}
        menuTitle=""
        isMenuPrimaryAction
        onPressMenuItem={handleAvailableNetworksPress}
        onPress={handleAvailableNetworksPress}
        useActionSheetFallback={false}
      >
        <Box
          borderRadius={99}
          padding="8px"
          paddingHorizontal={{ custom: 16 }}
          marginHorizontal={{ custom: marginHorizontal }}
          justifyContent="center"
        >
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
                      background="body"
                      key={`availbleNetwork-${network}`}
                      marginLeft={{ custom: -6 }}
                      style={{
                        backgroundColor: colors.transparent,
                        zIndex: availableNetworks?.length - index,
                        borderRadius: 30,
                      }}
                      width={{ custom: 22 }}
                    >
                      {network !== 'mainnet' ? (
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
                          forcedShadowColor={undefined}
                          type={AssetType.token}
                        />
                      )}
                    </Box>
                  );
                })}
              </Box>

              <Box marginLeft={{ custom: 6 }}>
                <Text
                  color="secondary60"
                  size="14px"
                  weight="semibold"
                  numberOfLines={2}
                >
                  {availableNetworks?.length > 1
                    ? lang.t('expanded_state.asset.available_networks', {
                        availableNetworks: availableNetworks?.length,
                      })
                    : lang.t('expanded_state.asset.available_networkv2', {
                        availableNetwork:
                          networkInfo[availableNetworks?.[0]].name,
                      })}
                </Text>
              </Box>
            </Inline>
            <Text
              align="center"
              color="secondary60"
              size="14px"
              weight="semibold"
            >
              {availableNetworks?.length > 1 ? '􀁱' : '􀯻'}
            </Text>
          </Inline>
        </Box>
      </Button>
      {hideDivider ? null : (
        <Divider
          color={colors.rowDividerExtraLight}
          backgroundColor={undefined}
        />
      )}
    </>
  );
};

export default AvailableNetworksv2;
