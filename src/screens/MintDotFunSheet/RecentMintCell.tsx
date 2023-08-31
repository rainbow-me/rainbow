import React from 'react';
import { useNavigation } from '@/navigation';
import { globalColors } from '@/design-system/color/palettes';
import { ImgixImage } from '@/components/images';
import {
  convertRawAmountToDecimalFormat,
  handleSignificantDecimals,
} from '@/helpers/utilities';
import { CoinIcon } from '@/components/coin-icon';
import {
  AccentColorProvider,
  Bleed,
  Box,
  Inline,
  Inset,
  Text,
  useBackgroundColor,
  useColorMode,
} from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';
import { useTheme } from '@/theme';
import { CardSize } from '@/components/unique-token/CardSize';
import { View } from 'react-native';
import { MintableCollection, NftSample } from '@/graphql/__generated__/arc';
import { getTimeElapsedFromDate } from './utils';
import { getNetworkFromChainId } from '@/utils/ethereumUtils';
import { getNetworkObj } from '@/networks';

export const NFT_IMAGE_SIZE = 111;

export const Placeholder = () => {
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
};

export function RecentMintCell({
  recentMint,
  collection,
}: {
  recentMint: NftSample;
  collection: MintableCollection;
}) {
  const { isDarkMode } = useTheme();

  const surfacePrimaryElevated = useBackgroundColor('surfacePrimaryElevated');
  const surfaceSecondaryElevated = useBackgroundColor(
    'surfaceSecondaryElevated'
  );

  const currency = getNetworkObj(getNetworkFromChainId(collection.chainId))
    .nativeCurrency;

  const amount = convertRawAmountToDecimalFormat(recentMint.value);

  const timeElapsed = getTimeElapsedFromDate(new Date(recentMint.mintTime));

  const isFree = amount === '0';

  return (
    <View style={{ marginVertical: 10 }}>
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
              uri: recentMint.imageURI ?? collection.imageURL,
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
    </View>
  );
}
