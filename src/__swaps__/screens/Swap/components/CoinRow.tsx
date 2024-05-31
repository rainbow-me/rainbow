import React, { useCallback, useMemo } from 'react';
import { ButtonPressAnimation } from '@/components/animations';
import { Box, Column, Columns, HitSlop, Inline, Text } from '@/design-system';
import { TextColor } from '@/design-system/color/palettes';
import { CoinRowButton } from '@/__swaps__/screens/Swap/components/CoinRowButton';
import { BalancePill } from '@/__swaps__/screens/Swap/components/BalancePill';
import { ChainId } from '@/__swaps__/types/chains';
import { toggleFavorite, useFavorites } from '@/resources/favorites';
import { ETH_ADDRESS } from '@/references';
import Animated from 'react-native-reanimated';
import { StyleSheet } from 'react-native';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { SwapCoinIcon } from './SwapCoinIcon';
import { ethereumUtils, haptics, showActionSheetWithOptions } from '@/utils';
import { ContextMenuButton } from 'react-native-ios-context-menu';
import { IS_ANDROID } from '@/env';
import { startCase } from 'lodash';
import { setClipboard } from '@/hooks/useClipboard';
import { RainbowNetworks } from '@/networks';
import * as i18n from '@/languages';

const InfoButton = ({ address, chainId }: { address: string; chainId: ChainId }) => {
  const network = RainbowNetworks.find(network => network.id === chainId)?.value;

  const handleCopy = useCallback(() => {
    haptics.selection();
    setClipboard(address);
  }, [address]);

  const options = {
    copy: {
      title: i18n.t(i18n.l.exchange.coin_row.copy_contract_address),
      action: handleCopy,
    },
    ...(network
      ? {
          blockExplorer: {
            title: i18n.t(i18n.l.exchange.coin_row.view_on, { blockExplorerName: startCase(ethereumUtils.getBlockExplorer(network)) }),
            action: () => ethereumUtils.openAddressInBlockExplorer(address, network),
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
      ...(network
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

  const handlePressMenuItem =
    // @ts-expect-error ContextMenu is an untyped JS component and can't type its onPress handler properly
    async ({ nativeEvent: { actionKey } }) => {
      if (actionKey === 'copyAddress') {
        options.copy.action();
      } else if (actionKey === 'blockExplorer' && network) {
        options.blockExplorer?.action();
      }
    };

  const onPressAndroid = () =>
    showActionSheetWithOptions(
      {
        options: [options.copy.title, ...(network ? [options.blockExplorer?.title] : [])],
        showSeparators: true,
      },
      (idx: number) => {
        if (idx === 0) {
          options.copy.action();
        }
        if (idx === 1 && network) {
          options.blockExplorer?.action();
        }
      }
    );

  return (
    <ContextMenuButton
      activeOpacity={0}
      // @ts-ignore
      menuConfig={menuConfig}
      onPress={IS_ANDROID ? onPressAndroid : undefined}
      isMenuPrimaryAction
      onPressMenuItem={handlePressMenuItem}
      useActionSheetFallback={false}
      wrapNativeComponent={false}
    >
      <CoinRowButton icon="􀅳" outline size="icon 14px" />
    </ContextMenuButton>
  );
};

export const CoinRow = ({
  address,
  mainnetAddress,
  chainId,
  balance,
  isTrending,
  name,
  nativeBalance,
  color,
  iconUrl,
  onPress,
  output,
  symbol,
}: {
  address: string;
  mainnetAddress: string;
  chainId: ChainId;
  balance: string;
  isTrending?: boolean;
  name: string;
  nativeBalance: string;
  color: string | undefined;
  iconUrl: string | undefined;
  onPress?: () => void;
  output?: boolean;
  symbol: string;
}) => {
  const { AnimatedSwapStyles } = useSwapContext();
  const { favoritesMetadata } = useFavorites();

  const favorites = Object.values(favoritesMetadata);

  const isFavorite = (address: string) => {
    return favorites.find(fav =>
      fav.address === ETH_ADDRESS ? '0x0000000000000000000000000000000000000000' === address : fav.address === address
    );
  };

  const percentChange = useMemo(() => {
    if (isTrending) {
      const rawChange = Math.random() * 30;
      const isNegative = Math.random() < 0.2;
      const prefix = isNegative ? '-' : '+';
      const color: TextColor = isNegative ? 'red' : 'green';
      const change = `${rawChange.toFixed(1)}%`;

      return { change, color, prefix };
    }
  }, [isTrending]);

  return (
    <Box>
      <Columns alignVertical="center">
        <Column>
          <ButtonPressAnimation disallowInterruption onPress={onPress} scaleTo={0.95}>
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
                  <SwapCoinIcon
                    iconUrl={iconUrl}
                    address={address}
                    mainnetAddress={mainnetAddress}
                    large
                    network={ethereumUtils.getNetworkFromChainId(chainId)}
                    symbol={symbol}
                    color={color}
                  />
                  <Box gap={10} flexShrink={1} justifyContent="center">
                    <Text color="label" size="17pt" weight="semibold" numberOfLines={1} ellipsizeMode="tail">
                      {name}
                    </Text>
                    <Inline alignVertical="center" space={{ custom: 5 }}>
                      <Text color="labelTertiary" size="13pt" weight="semibold">
                        {output ? symbol : `${balance}`}
                      </Text>
                      {isTrending && percentChange && (
                        <Inline alignVertical="center" space={{ custom: 1 }}>
                          <Text align="center" color={percentChange.color} size="12pt" weight="bold">
                            {percentChange.prefix}
                          </Text>
                          <Text color={percentChange.color} size="13pt" weight="semibold">
                            {percentChange.change}
                          </Text>
                        </Inline>
                      )}
                    </Inline>
                  </Box>
                </Box>
                {!output && <BalancePill balance={nativeBalance} />}
              </Box>
            </HitSlop>
          </ButtonPressAnimation>
        </Column>
        {output && (
          <Column width="content">
            <Box paddingLeft="12px" paddingRight="20px">
              <Inline space="8px">
                <InfoButton address={address} chainId={chainId} />
                <CoinRowButton
                  color={isFavorite(address) ? '#FFCB0F' : undefined}
                  onPress={() => toggleFavorite(address)}
                  icon="􀋃"
                  weight="black"
                />
              </Inline>
            </Box>
          </Column>
        )}
      </Columns>
    </Box>
  );
};

export const styles = StyleSheet.create({
  solidColorCoinIcon: {
    opacity: 0.4,
  },
});
