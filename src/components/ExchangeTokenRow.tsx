import React from 'react';
import isEqual from 'react-fast-compare';
import { Box, Column, Columns, Inline, Stack, Text } from '@/design-system';
import { isNativeAsset } from '@/handlers/assets';
import { useAsset } from '@/hooks';
import { ButtonPressAnimation } from '@/components/animations';
import { FloatingEmojis } from '@/components/floating-emojis';
import { IS_IOS } from '@/env';
import { FavStar, Info } from '@/components/asset-list/RecyclerAssetList2/FastComponents/FastCurrencySelectionRow';
import { View } from 'react-native';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { ChainId } from '@/state/backendNetworks/types';
import { ParsedAddressAsset } from '@/entities';

interface ExchangeTokenRowProps {
  item: any;
}

export default React.memo(function ExchangeTokenRow({
  item: {
    chainId,
    showBalance,
    showFavoriteButton,
    onPress,
    theme,
    nativeCurrencySymbol,
    favorite,
    toggleFavorite,
    contextMenuProps,
    symbol,
    address,
    name,
    testID,
    disabled,
  },
}: ExchangeTokenRowProps) {
  const item = useAsset({
    address,
    chainId,
  });

  const rowTestID = `${testID}-exchange-coin-row-${symbol ?? item?.symbol ?? ''}-${chainId || ChainId.mainnet}`;

  const isInfoButtonVisible = !item?.isNativeAsset || (!isNativeAsset(address ?? item?.address, chainId) && !showBalance);

  return (
    <Columns alignVertical="center" space="10px">
      <Column>
        <Box
          paddingLeft="20px"
          as={ButtonPressAnimation}
          onPress={onPress}
          style={[disabled && { opacity: 0.5 }]}
          testID={rowTestID}
          disabled={disabled}
        >
          <Columns alignVertical="center" space="10px">
            <Column width="content">
              <View style={{ height: 59, paddingTop: 9 }}>
                <RainbowCoinIcon
                  chainId={chainId}
                  color={item?.colors?.primary || item?.colors?.fallback || undefined}
                  icon={item?.icon_url || ''}
                  symbol={item?.symbol || symbol}
                />
              </View>
            </Column>
            <Column>
              <Stack space="8px">
                <Text size="15pt" color="primary (Deprecated)" weight="semibold" numberOfLines={1}>
                  {name ?? item?.name}
                </Text>
                {showBalance && (item as ParsedAddressAsset)?.balance?.display && (
                  <Text size="13pt" color={{ custom: theme.colors.blueGreyDark50 }} numberOfLines={1} weight="medium">
                    {(item as ParsedAddressAsset)?.balance?.display ?? ''}
                  </Text>
                )}
                {!showBalance && (
                  <Text size="13pt" color={{ custom: theme.colors.blueGreyDark50 }} weight="medium" numberOfLines={1}>
                    {symbol ?? item?.symbol ?? ''}
                  </Text>
                )}
              </Stack>
            </Column>
          </Columns>
        </Box>
      </Column>
      <Column width="content">
        <Box paddingRight="20px">
          {showBalance && (
            <Box background="fillSecondary" padding="8px" borderRadius={15}>
              <Text size="15pt" weight="medium" color="labelSecondary">
                {(item as ParsedAddressAsset)?.native?.balance?.display ?? `${nativeCurrencySymbol}0.00`}
              </Text>
            </Box>
          )}
          {!showBalance && (
            <Inline alignVertical="center" space="12px">
              {isInfoButtonVisible && <Info contextMenuProps={contextMenuProps} showFavoriteButton={showFavoriteButton} theme={theme} />}
              {showFavoriteButton &&
                (IS_IOS ? (
                  <FloatingEmojis
                    centerVertically
                    disableHorizontalMovement
                    disableVerticalMovement
                    distance={70}
                    duration={400}
                    emojis={['glowing_star']}
                    fadeOut={false}
                    marginTop={-4}
                    range={[0, 0]}
                    scaleTo={0}
                    size={32}
                    wiggleFactor={0}
                  >
                    {({ onNewEmoji }: { onNewEmoji: () => void }) => (
                      <FavStar favorite={favorite} theme={theme} toggleFavorite={() => toggleFavorite(onNewEmoji)} />
                    )}
                  </FloatingEmojis>
                ) : (
                  <FavStar favorite={favorite} theme={theme} toggleFavorite={toggleFavorite} />
                ))}
            </Inline>
          )}
        </Box>
      </Column>
    </Columns>
  );
}, isEqual);
