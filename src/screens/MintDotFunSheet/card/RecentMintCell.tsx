import React, { useReducer } from 'react';
import { globalColors } from '@/design-system/color/palettes';
import { ImgixImage } from '@/components/images';
import {
  AccentColorProvider,
  Bleed,
  Box,
  Inline,
  Inset,
  Text,
  useBackgroundColor,
} from '@/design-system';
import { useTheme } from '@/theme';
import { CardSize } from '@/components/unique-token/CardSize';
import { View } from 'react-native';
import { NftSample } from '@/graphql/__generated__/arc';

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

export function RecentMintCell({ recentMint }: { recentMint: NftSample }) {
  const { isDarkMode } = useTheme();

  const surfacePrimaryElevated = useBackgroundColor('surfacePrimaryElevated');
  const surfaceSecondaryElevated = useBackgroundColor(
    'surfaceSecondaryElevated'
  );

  const [imageError, setImageError] = useReducer(() => true, false);

  return (
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
        {!imageError ? (
          <ImgixImage
            source={{
              uri: recentMint.imageURI ?? '',
            }}
            fm="png"
            style={{
              width: NFT_IMAGE_SIZE,
              height: NFT_IMAGE_SIZE,
              borderRadius: 16,
              backgroundColor: isDarkMode
                ? surfaceSecondaryElevated
                : surfacePrimaryElevated,
            }}
            onError={setImageError}
            size={CardSize}
          />
        ) : (
          <Box
            style={{
              width: NFT_IMAGE_SIZE,
              height: NFT_IMAGE_SIZE,
              borderRadius: 16,
              backgroundColor: isDarkMode
                ? surfaceSecondaryElevated
                : surfacePrimaryElevated,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              align="center"
              color="labelQuaternary"
              size="20pt"
              weight="semibold"
            >
              􀣵
            </Text>
          </Box>
        )}
      </View>
    </View>
  );
}
