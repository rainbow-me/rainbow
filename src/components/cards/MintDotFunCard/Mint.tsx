import React from 'react';
import { useNavigation } from '@/navigation';
import { globalColors } from '@/design-system/color/palettes';
import { ImgixImage } from '@/components/images';
import { handleSignificantDecimals } from '@/helpers/utilities';
import { CoinIcon } from '@/components/coin-icon';
import {
  AccentColorProvider,
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

export const CELL_HORIZONTAL_PADDING = 5;
export const NFT_IMAGE_SIZE = 111;

export const FakeOffer = () => {
  const { colors } = useTheme();
  return (
    <AccentColorProvider color={colors.skeleton}>
      <Inset vertical="10px" horizontal={{ custom: 7 }}>
        <Box
          background="accent"
          width={{ custom: NFT_IMAGE_SIZE }}
          height={{ custom: NFT_IMAGE_SIZE }}
          borderRadius={12}
        />
        <Box paddingBottom={{ custom: 7 }} paddingTop={{ custom: 12 }}>
          <Inline space="4px" alignVertical="center">
            <Box
              background="accent"
              width={{ custom: 12 }}
              height={{ custom: 12 }}
              borderRadius={6}
            />
            <Box
              background="accent"
              width={{ custom: 50 }}
              height={{ custom: 9.3333 }}
              borderRadius={9.3333 / 2}
            />
          </Inline>
        </Box>
        <Box
          background="accent"
          width={{ custom: 50 }}
          height={{ custom: 9.3333 }}
          borderRadius={9.3333 / 2}
        />
      </Inset>
    </AccentColorProvider>
  );
};

export const Mint = () => {
  const { navigate } = useNavigation();
  const { colorMode } = useColorMode();
  const { isDarkMode } = useTheme();

  const surfacePrimaryElevated = useBackgroundColor('surfacePrimaryElevated');
  const surfaceSecondaryElevated = useBackgroundColor(
    'surfaceSecondaryElevated'
  );

  const cryptoAmount = handleSignificantDecimals(
    12,
    18,
    // don't show more than 3 decimals
    3,
    undefined,
    // abbreviate if amount is >= 10,000
    12 >= 10_000
  );

  return (
    <ButtonPressAnimation onPress={() => {}} style={{ marginVertical: 10 }}>
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
            shadowColor:
              colorMode === 'dark' || !'blue' ? globalColors.grey100 : 'blue',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.24,
            shadowRadius: 9,
          }}
        >
          <ImgixImage
            source={{
              uri:
                'https://i.seadn.io/gcs/files/beb92069cbb19fb52206ab431562ec47.png?auto=format&dpr=1&w=3840',
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
        <CoinIcon
          address={'eth'}
          size={12}
          symbol={'ETH'}
          style={{ marginRight: 4, marginVertical: -4 }}
        />
        <Text color="label" size="11pt" weight="bold">
          {cryptoAmount}
        </Text>
      </View>
      <Text color="labelTertiary" size="11pt" weight="semibold">
        {'TEST'}
      </Text>
    </ButtonPressAnimation>
  );
};
