import React from 'react';
import { globalColors } from '@/design-system/color/palettes';
import { ImgixImage } from '@/components/images';
import { convertRawAmountToDecimalFormat } from '@/helpers/utilities';
import { CoinIcon } from '@/components/coin-icon';
import {
  AccentColorProvider,
  Bleed,
  Box,
  Inline,
  Inset,
  Text,
  useBackgroundColor,
} from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';
import { useTheme } from '@/theme';
import { CardSize } from '@/components/unique-token/CardSize';
import { Linking, View } from 'react-native';
import { MintableCollection } from '@/graphql/__generated__/arc';
import { getNetworkFromChainId } from '@/utils/ethereumUtils';
import { getNetworkObj } from '@/networks';

export const NFT_IMAGE_SIZE = 111;

export function Placeholder() {
  const { colors } = useTheme();
  return (
    <AccentColorProvider color={colors.skeleton}>
      <Inset vertical="10px">
        <Box
          background="accent"
          width={{ custom: NFT_IMAGE_SIZE }}
          height={{ custom: NFT_IMAGE_SIZE }}
          borderRadius={12}
        />
        <Box paddingBottom="10px" paddingTop="12px">
          <Inline space="4px" alignVertical="center">
            <Bleed vertical="4px">
              <Box
                background="accent"
                width={{ custom: 12 }}
                height={{ custom: 12 }}
                borderRadius={6}
              />
            </Bleed>
            <Box
              background="accent"
              width={{ custom: 50 }}
              height={{ custom: 8 }}
              borderRadius={4}
            />
          </Inline>
        </Box>
        <Box
          background="accent"
          width={{ custom: 50 }}
          height={{ custom: 8 }}
          borderRadius={4}
        />
      </Inset>
    </AccentColorProvider>
  );
}

export function CollectionCell({
  collection,
}: {
  collection: MintableCollection;
}) {
  const { isDarkMode } = useTheme();

  const surfacePrimaryElevated = useBackgroundColor('surfacePrimaryElevated');
  const surfaceSecondaryElevated = useBackgroundColor(
    'surfaceSecondaryElevated'
  );

  const currency = getNetworkObj(getNetworkFromChainId(collection.chainId))
    .nativeCurrency;

  const amount = convertRawAmountToDecimalFormat(collection.mintStatus.price);

  const isFree = amount === '0';

  return (
    <ButtonPressAnimation
      onPress={() => Linking.openURL(collection.externalURL)}
      style={{ marginVertical: 10, width: NFT_IMAGE_SIZE }}
    >
      <View
        style={{
          shadowColor: globalColors.grey100,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.02,
          shadowRadius: 3,
        }}
      >
        <View
          style={{
            shadowColor: globalColors.grey100,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.24,
            shadowRadius: 9,
          }}
        >
          <ImgixImage
            source={{
              uri: collection.imageURL,
            }}
            style={{
              width: NFT_IMAGE_SIZE,
              height: NFT_IMAGE_SIZE,
              borderRadius: 12,
              backgroundColor: isDarkMode
                ? surfaceSecondaryElevated
                : surfacePrimaryElevated,
            }}
            size={CardSize}
          />
        </View>
      </View>
      <View
        style={{
          paddingBottom: 10,
          paddingTop: 12,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        {!isFree && (
          <CoinIcon
            address={currency.address}
            size={12}
            symbol={currency.symbol}
            style={{ marginRight: 4, marginVertical: -4 }}
          />
        )}
        <View style={{ width: NFT_IMAGE_SIZE - 16 }}>
          <Text color="label" size="11pt" weight="bold" numberOfLines={1}>
            {isFree ? 'FREE' : amount}
          </Text>
        </View>
      </View>
      <Text
        color="labelTertiary"
        size="11pt"
        weight="semibold"
        numberOfLines={1}
      >
        {collection.name}
      </Text>
    </ButtonPressAnimation>
  );
}
