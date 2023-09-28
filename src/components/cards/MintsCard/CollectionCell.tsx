import React, { useEffect, useState } from 'react';
import { globalColors } from '@/design-system/color/palettes';
import { convertRawAmountToRoundedDecimal } from '@/helpers/utilities';
import { CoinIcon } from '@/components/coin-icon';
import {
  AccentColorProvider,
  Bleed,
  Box,
  Cover,
  Inline,
  Inset,
  Text,
} from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';
import { useTheme } from '@/theme';
import { Linking, View } from 'react-native';
import { MintableCollection } from '@/graphql/__generated__/arc';
import { getNetworkFromChainId } from '@/utils/ethereumUtils';
import { getNetworkObj } from '@/networks';
import { analyticsV2 } from '@/analytics';
import * as i18n from '@/languages';
import { IS_IOS } from '@/env';
import { ImgixImage } from '@/components/images';

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

  const [mediaRendered, setMediaRendered] = useState(false);

  const currency = getNetworkObj(getNetworkFromChainId(collection.chainId))
    .nativeCurrency;

  const amount = convertRawAmountToRoundedDecimal(
    collection.mintStatus.price,
    18,
    6
  );

  const isFree = !amount;

  const imageUrl =
    collection.imageURL ||
    collection?.recentMints?.find(m => m.imageURI)?.imageURI;

  useEffect(() => setMediaRendered(false), [imageUrl]);

  return (
    <ButtonPressAnimation
      onPress={() => {
        analyticsV2.track(analyticsV2.event.mintsPressedCollectionCell, {
          contractAddress: collection.contractAddress,
          chainId: collection.chainId,
          priceInEth: amount,
        });
        Linking.openURL(collection.externalURL);
      }}
      style={{ width: NFT_IMAGE_SIZE }}
    >
      <View
        style={{
          width: NFT_IMAGE_SIZE,
          height: NFT_IMAGE_SIZE,
        }}
      >
        {!mediaRendered && (
          <Box
            width="full"
            height="full"
            alignItems="center"
            justifyContent="center"
            borderRadius={12}
            background="fillSecondary"
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
        {!!imageUrl && (
          <Cover>
            <View
              style={{
                shadowColor: globalColors.grey100,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.02,
                shadowRadius: 3,
              }}
            >
              <View
                style={
                  IS_IOS
                    ? {
                        shadowColor: globalColors.grey100,
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.24,
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
                    borderRadius: 12,
                  }}
                  size={NFT_IMAGE_SIZE}
                  source={{ uri: imageUrl }}
                  fm="png"
                />
              </View>
            </View>
          </Cover>
        )}
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
            {isFree
              ? i18n.t(i18n.l.mints.mints_card.collection_cell.free)
              : amount}
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
