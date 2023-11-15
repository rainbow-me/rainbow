import React from 'react';
import isEqual from 'react-fast-compare';
import { Box, Column, Columns, Inline, Stack, Text } from '@/design-system';
import { isNativeAsset } from '@/handlers/assets';
import { Network } from '@/networks/types';
import { useAccountAsset, useDimensions } from '@/hooks';
import { ethereumUtils } from '@/utils';
import FastCoinIcon from '../asset-list/RecyclerAssetList2/FastComponents/FastCoinIcon';
import { ButtonPressAnimation } from '../animations';
import { FloatingEmojis } from '../floating-emojis';
import { IS_IOS } from '@/env';
import {
  FavStar,
  Info,
} from '../asset-list/RecyclerAssetList2/FastComponents/FastCurrencySelectionRow';

interface ExchangeTokenRowProps {
  item: any;
}

export default React.memo(function ExchangeTokenRow({
  item: {
    uniqueId,
    showBalance,
    showFavoriteButton,
    onPress,
    theme,
    nativeCurrency,
    nativeCurrencySymbol,
    favorite,
    toggleFavorite,
    contextMenuProps,
    symbol,
    address,
    mainnet_address,
    name,
    testID,
    type,
    disabled,
  },
}: ExchangeTokenRowProps) {
  const { width: deviceWidth } = useDimensions();

  // TODO https://github.com/rainbow-me/rainbow/pull/3313/files#r876259954
  const item = useAccountAsset(uniqueId, nativeCurrency);
  const network = ethereumUtils.getNetworkFromType(type) ?? Network.mainnet;
  const rowTestID = `${testID}-exchange-coin-row-${
    symbol ?? item?.symbol ?? ''
  }-${type || 'token'}`;

  const isInfoButtonVisible =
    !item?.isNativeAsset ||
    (!isNativeAsset(address ?? item?.address, network) && !showBalance);

  return (
    <Columns alignVertical="center" space="10px">
      <Column>
        <Box
          paddingLeft="20px"
          as={ButtonPressAnimation}
          // @ts-ignore
          onPress={onPress}
          style={[disabled && { opacity: 0.5 }]}
          testID={rowTestID}
          disabled={disabled}
        >
          <Columns alignVertical="center" space="10px">
            <Column width="content">
              <Box
                as={FastCoinIcon}
                address={address || item?.address}
                network={network}
                mainnetAddress={mainnet_address ?? item?.mainnet_address}
                symbol={symbol ?? item?.symbol}
                theme={theme}
              />
            </Column>
            <Column>
              <Stack space="8px">
                <Text
                  size="15pt"
                  color="primary (Deprecated)"
                  weight="semibold"
                  numberOfLines={1}
                >
                  {name ?? item?.name}
                </Text>
                {showBalance && item?.balance?.display && (
                  <Text
                    size="13pt"
                    color={{ custom: theme.colors.blueGreyDark50 }}
                    numberOfLines={1}
                    weight="medium"
                  >
                    {item?.balance?.display ?? ''}
                  </Text>
                )}
                {!showBalance && (
                  <Text
                    size="13pt"
                    color={{ custom: theme.colors.blueGreyDark50 }}
                    weight="medium"
                    numberOfLines={1}
                  >
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
                {item?.native?.balance?.display ??
                  `${nativeCurrencySymbol}0.00`}
              </Text>
            </Box>
          )}
          {!showBalance && (
            <Inline alignVertical="center" space="12px">
              {isInfoButtonVisible && (
                <Info
                  contextMenuProps={contextMenuProps}
                  showFavoriteButton={showFavoriteButton}
                  theme={theme}
                />
              )}
              {showFavoriteButton &&
                (IS_IOS ? (
                  // @ts-ignore
                  <FloatingEmojis
                    centerVertically
                    deviceWidth={deviceWidth}
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
                      <FavStar
                        favorite={favorite}
                        theme={theme}
                        toggleFavorite={() => toggleFavorite(onNewEmoji)}
                      />
                    )}
                  </FloatingEmojis>
                ) : (
                  <FavStar
                    favorite={favorite}
                    theme={theme}
                    toggleFavorite={toggleFavorite}
                  />
                ))}
            </Inline>
          )}
        </Box>
      </Column>
    </Columns>
  );
},
isEqual);
