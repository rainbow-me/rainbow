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
import { Linking, View } from 'react-native';
import { MintableCollection, NftSample } from '@/graphql/__generated__/arc';

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

export function Cell({
  mintableCollection,
}: {
  mintableCollection: MintableCollection;
}) {
  const { navigate } = useNavigation();
  const { colorMode } = useColorMode();
  const { isDarkMode } = useTheme();

  const surfacePrimaryElevated = useBackgroundColor('surfacePrimaryElevated');
  const surfaceSecondaryElevated = useBackgroundColor(
    'surfaceSecondaryElevated'
  );

  // const cryptoAmount = handleSignificantDecimals(
  //   mintableCollection.mintStatus.price,
  //   18,
  //   // don't show more than 3 decimals
  //   3,
  //   undefined,
  //   // abbreviate if amount is >= 10,000
  //   12 >= 10_000
  // );

  const cryptoAmount = convertRawAmountToDecimalFormat(
    mintableCollection.mintStatus.price
  );

  return (
    <ButtonPressAnimation
      onPress={() => Linking.openURL(mintableCollection.externalURL)}
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
            shadowColor:
              colorMode === 'dark' || !'blue' ? globalColors.grey100 : 'blue',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.24,
            shadowRadius: 9,
          }}
        >
          <ImgixImage
            source={{
              uri: mintableCollection.imageURL,
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
        {cryptoAmount !== '0' && (
          <CoinIcon
            address={'eth'}
            size={12}
            symbol={'ETH'}
            style={{ marginRight: 4, marginVertical: -4 }}
          />
        )}
        <Text color="label" size="11pt" weight="bold" numberOfLines={1}>
          {cryptoAmount === '0' ? 'FREE' : cryptoAmount}
        </Text>
      </View>
      <Text
        color="labelTertiary"
        size="11pt"
        weight="semibold"
        numberOfLines={1}
      >
        {mintableCollection.name}
      </Text>
    </ButtonPressAnimation>
  );
}
