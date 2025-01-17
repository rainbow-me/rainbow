import { BalancePill } from '@/__swaps__/screens/Swap/components/BalancePill';
import { CoinRowButton } from '@/__swaps__/screens/Swap/components/CoinRowButton';
import { AddressOrEth, ParsedSearchAsset, UniqueId } from '@/__swaps__/types/assets';
import { ChainId } from '@/state/backendNetworks/types';
import { SearchAsset } from '@/__swaps__/types/search';
import { ButtonPressAnimation } from '@/components/animations';
import { ContextMenuButton } from '@/components/context-menu';
import { Box, Column, Columns, HitSlop, Inline, Text } from '@/design-system';
import { setClipboard } from '@/hooks/useClipboard';
import * as i18n from '@/languages';
import { ETH_ADDRESS } from '@/references';
import { toggleFavorite } from '@/resources/favorites';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { ethereumUtils, haptics, showActionSheetWithOptions } from '@/utils';
import { startCase } from 'lodash';
import React, { useCallback, useMemo } from 'react';
import { GestureResponderEvent } from 'react-native';
import { OnPressMenuItemEventObject } from 'react-native-ios-context-menu';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

export const COIN_ROW_WITH_PADDING_HEIGHT = 56;

function determineFavoriteAddressAndChain(address: AddressOrEth, mainnetAddress: AddressOrEth | undefined, chainId: ChainId | undefined) {
  // if no mainnet address, default to fetch the favorite for the address we have and chain we have
  if (!mainnetAddress) {
    return {
      addressToFetch: address,
      chainToFetchOn: chainId ?? ChainId.mainnet,
    };
  }

  const isL2Ethereum = mainnetAddress.toLowerCase() === ETH_ADDRESS;

  return {
    addressToFetch: isL2Ethereum ? ETH_ADDRESS : mainnetAddress,
    chainToFetchOn: ChainId.mainnet,
  };
}

interface InputCoinRowProps {
  isFavorite?: boolean;
  isTrending?: boolean;
  nativePriceChange?: string;
  onPress: (asset: ParsedSearchAsset | null) => void;
  output?: false | undefined;
  uniqueId: UniqueId;
  testID?: string;
}

type PartialAsset = Pick<SearchAsset, 'address' | 'chainId' | 'colors' | 'icon_url' | 'mainnetAddress' | 'name' | 'symbol' | 'uniqueId'>;

interface OutputCoinRowProps extends PartialAsset {
  isFavorite: boolean;
  onPress: () => void;
  output: true;
  nativePriceChange?: string;
  isTrending?: boolean;
  testID?: string;
}

type CoinRowProps = InputCoinRowProps | OutputCoinRowProps;

export function CoinRow({ isFavorite, onPress, output, uniqueId, testID, ...assetProps }: CoinRowProps) {
  const inputAsset = useUserAssetsStore(state => (output ? undefined : state.getUserAsset(uniqueId)));
  const outputAsset = output ? (assetProps as PartialAsset) : undefined;

  const asset = output ? outputAsset : inputAsset;
  const { address, chainId, colors, icon_url, mainnetAddress, name, symbol } = asset || {};

  /**
* ⚠️ TODO: Re-enable when trending tokens are added
*
* const percentChange = useMemo(() => {
*   if (isTrending && nativePriceChange) {
*     const rawChange = parseFloat(nativePriceChange);
*     const isNegative = rawChange < 0;
*     const prefix = isNegative ? '-' : '+';
*     const color: TextColor = isNegative ? 'red' : 'green';
*     const change = `${trimTrailingZeros(Math.abs(rawChange).toFixed(1))}%`;

*     return { change, color, prefix };
*   }
* }, [isTrending, nativePriceChange]);
*/

  const favoritesIconColor = useMemo(() => {
    return isFavorite ? '#FFCB0F' : undefined;
  }, [isFavorite]);

  const handleToggleFavorite = useCallback(() => {
    if (!address) return;

    const { addressToFetch, chainToFetchOn } = determineFavoriteAddressAndChain(address, mainnetAddress, chainId);
    toggleFavorite(addressToFetch, chainToFetchOn);
  }, [address, mainnetAddress, chainId]);

  const onPressHandler = useCallback(
    (event: GestureResponderEvent) => {
      event?.stopPropagation();

      if (output) {
        return onPress();
      }

      return onPress(inputAsset || null);
    },
    [inputAsset, onPress, output]
  );

  if (!address || !chainId) return null;

  return (
    <Box testID={testID} style={{ height: COIN_ROW_WITH_PADDING_HEIGHT, width: '100%' }}>
      <Columns alignVertical="center">
        <Column>
          <ButtonPressAnimation disallowInterruption onPress={onPressHandler} scaleTo={0.95}>
            <HitSlop vertical="10px">
              <Box
                alignItems="center"
                paddingLeft="20px"
                paddingRight={!output ? '20px' : undefined}
                paddingVertical="10px"
                flexDirection="row"
                justifyContent="space-between"
                width="full"
                gap={12}
              >
                <Box flexDirection="row" gap={10} flexShrink={1} justifyContent="center">
                  <RainbowCoinIcon
                    size={36}
                    icon={icon_url}
                    chainId={chainId}
                    symbol={symbol || ''}
                    color={colors?.primary}
                    chainSize={16}
                  />
                  <Box gap={10} flexShrink={1} justifyContent="center">
                    <Text color="label" size="17pt" weight="semibold" numberOfLines={1} ellipsizeMode="tail">
                      {name}
                    </Text>
                    <Inline alignVertical="center" space={{ custom: 5 }} wrap={false}>
                      <Text color="labelTertiary" numberOfLines={1} size="13pt" weight="semibold">
                        {output ? symbol : `${inputAsset?.balance.display}`}
                      </Text>
                      {/* {nativePriceChange && percenChange && (
                        <Inline alignVertical="center" space={{ custom: 1 }} wrap={false}>
                          <Text align="center" color={percentChange.color} size="12pt" weight="bold">
                            {percentChange.prefix}
                          </Text>
                          <Text color={percentChange.color} size="13pt" weight="semibold">
                            {percentChange.change}
                          </Text>
                        </Inline>
                      )} */}
                    </Inline>
                  </Box>
                </Box>
                {!output && <BalancePill balance={inputAsset?.native?.balance.display ?? ''} />}
              </Box>
            </HitSlop>
          </ButtonPressAnimation>
        </Column>
        {output && (
          <Column width="content">
            <Box paddingLeft="12px" paddingRight="20px">
              <Inline space="10px">
                <InfoButton address={address} chainId={chainId} />
                <CoinRowButton color={favoritesIconColor} onPress={handleToggleFavorite} icon="􀋃" weight="black" />
              </Inline>
            </Box>
          </Column>
        )}
      </Columns>
    </Box>
  );
}

const InfoButton = ({ address, chainId }: { address: string; chainId: ChainId }) => {
  const getSupportedChainIds = useBackendNetworksStore(state => state.getSupportedChainIds);
  const supportedChain = getSupportedChainIds().includes(chainId);

  const handleCopy = useCallback(() => {
    haptics.selection();
    setClipboard(address);
  }, [address]);

  const options = {
    copy: {
      title: i18n.t(i18n.l.exchange.coin_row.copy_contract_address),
      action: handleCopy,
    },
    ...(supportedChain
      ? {
          blockExplorer: {
            title: i18n.t(i18n.l.exchange.coin_row.view_on, { blockExplorerName: startCase(ethereumUtils.getBlockExplorer({ chainId })) }),
            action: () => ethereumUtils.openAddressInBlockExplorer({ address, chainId }),
          },
        }
      : {}),
  };

  const menuConfig = {
    menuItems: [
      {
        actionKey: 'copyAddress',
        actionTitle: options.copy.title,
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'doc.on.doc',
        },
      },
      ...(supportedChain
        ? [
            {
              actionKey: 'blockExplorer',
              actionTitle: options.blockExplorer?.title,
              icon: {
                iconType: 'SYSTEM',
                iconValue: 'link',
              },
            },
          ]
        : []),
    ],
    menuTitle: '',
  };

  const handlePressMenuItem = async ({ nativeEvent: { actionKey } }: OnPressMenuItemEventObject) => {
    if (actionKey === 'copyAddress') {
      options.copy.action();
    } else if (actionKey === 'blockExplorer' && supportedChain) {
      options.blockExplorer?.action();
    }
  };

  const onPressAndroid = () =>
    showActionSheetWithOptions(
      {
        options: [options.copy.title, ...(supportedChain ? [options.blockExplorer?.title] : [])],
        showSeparators: true,
      },
      (idx: number) => {
        if (idx === 0) {
          options.copy.action();
        }
        if (idx === 1 && supportedChain) {
          options.blockExplorer?.action();
        }
      }
    );

  return (
    <ContextMenuButton
      menuItems={menuConfig.menuItems}
      menuTitle={menuConfig.menuTitle}
      onPressAndroid={onPressAndroid}
      onPressMenuItem={handlePressMenuItem}
      testID={`coin-row-info-button-${address}`}
    >
      <CoinRowButton icon="􀅳" outline size="icon 14px" />
    </ContextMenuButton>
  );
};
