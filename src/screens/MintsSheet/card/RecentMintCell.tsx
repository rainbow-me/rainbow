import React, { useEffect, useState } from 'react';
import { globalColors } from '@/design-system/color/palettes';
import { Box, Cover, Text } from '@/design-system';
import { useTheme } from '@/theme';
import { View } from 'react-native';
import { MintedNft } from '@/graphql/__generated__/arc';
import { IS_IOS } from '@/env';
import { deviceUtils } from '@/utils';
import { NUM_NFTS } from './Card';
import { ImgixImage } from '@/components/images';

const NFT_IMAGE_SIZE = (deviceUtils.dimensions.width - 40 - (NUM_NFTS - 1) * 10) / NUM_NFTS;

export const Placeholder = () => {
  return (
    <Box
      style={{
        width: NFT_IMAGE_SIZE,
        height: NFT_IMAGE_SIZE,
      }}
      alignItems="center"
      justifyContent="center"
      borderRadius={16}
      background="fillSecondary"
    >
      <Text align="center" color="labelQuaternary" size="20pt" weight="semibold">
        􀣵
      </Text>
    </Box>
  );
};

export function RecentMintCell({ recentMint }: { recentMint: MintedNft }) {
  const { isDarkMode } = useTheme();

  const [mediaRendered, setMediaRendered] = useState(false);

  useEffect(() => setMediaRendered(false), [recentMint.imageURI]);

  return (
    <Box style={{ width: NFT_IMAGE_SIZE, height: NFT_IMAGE_SIZE }}>
      {!mediaRendered && <Placeholder />}
      {!!recentMint?.imageURI && (
        <Cover>
          <View
            style={
              IS_IOS
                ? {
                    shadowColor: globalColors.grey100,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.02,
                    shadowRadius: 3,
                  }
                : {}
            }
          >
            <View
              style={
                IS_IOS
                  ? {
                      shadowColor: globalColors.grey100,
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: isDarkMode ? 0.24 : 0.08,
                      shadowRadius: 9,
                    }
                  : {
                      shadowColor: globalColors.grey100,
                      elevation: 12,
                      shadowOpacity: isDarkMode ? 1 : 0.6,
                    }
              }
            >
              <ImgixImage
                style={{
                  width: NFT_IMAGE_SIZE,
                  height: NFT_IMAGE_SIZE,
                  borderRadius: 16,
                }}
                size={NFT_IMAGE_SIZE}
                source={{ uri: recentMint.imageURI }}
                fm="png"
              />
            </View>
          </View>
        </Cover>
      )}
    </Box>
  );
}
