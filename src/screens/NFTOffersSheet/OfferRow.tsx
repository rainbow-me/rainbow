import React from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  Bleed,
  Box,
  Column,
  Columns,
  globalColors,
  Inline,
  Inset,
  Stack,
  Text,
  useBackgroundColor,
  useColorMode,
} from '@/design-system';
import { CoinIcon } from '@/components/coin-icon';
import MaskedView from '@react-native-masked-view/masked-view';
import { NftOffer } from '@/graphql/__generated__/arc';
import { ImgixImage } from '@/components/images';
import {
  convertAmountToNativeDisplay,
  handleSignificantDecimals,
} from '@/helpers/utilities';
import { ButtonPressAnimation } from '@/components/animations';
import * as i18n from '@/languages';
import Routes from '@/navigation/routesNames';
import { analyticsV2 } from '@/analytics';
import { useTheme } from '@/theme';
import { CardSize } from '@/components/unique-token/CardSize';
import { View } from 'react-native';
import OfferRowMask from '@/assets/offerRowMask.png';
import { Source } from 'react-native-fast-image';

const NFT_SIZE = 50;
const MARKETPLACE_ORB_SIZE = 18;
const COIN_ICON_SIZE = 16;

const Mask = () => (
  <ImgixImage
    size={NFT_SIZE}
    source={OfferRowMask as Source}
    style={{
      width: NFT_SIZE,
      height: NFT_SIZE,
    }}
  />
);
export const FakeOfferRow = () => {
  const { isDarkMode } = useTheme();
  return (
    <Inset vertical="10px" horizontal="20px">
      <Columns space="16px" alignVertical="center">
        <Column width="content">
          <Box
            background={
              isDarkMode ? 'surfaceSecondaryElevated' : 'fillSecondary'
            }
            width={{ custom: NFT_SIZE }}
            height={{ custom: NFT_SIZE }}
            borderRadius={12}
          />
        </Column>
        <Column>
          <Stack space="10px">
            <Box
              background={
                isDarkMode ? 'surfaceSecondaryElevated' : 'fillSecondary'
              }
              width={{ custom: 70 }}
              height={{ custom: 12 }}
              borderRadius={6}
            />
            <Box
              background={
                isDarkMode ? 'surfaceSecondaryElevated' : 'fillSecondary'
              }
              width={{ custom: 100 }}
              height={{ custom: 9.3333 }}
              borderRadius={9.3333 / 2}
            />
          </Stack>
        </Column>
        <Column width="content">
          <Stack space="10px" alignHorizontal="right">
            <Inline space="6px" alignVertical="center">
              <Bleed vertical="2px">
                <Box
                  background={
                    isDarkMode ? 'surfaceSecondaryElevated' : 'fillSecondary'
                  }
                  width={{ custom: COIN_ICON_SIZE }}
                  height={{ custom: COIN_ICON_SIZE }}
                  borderRadius={99}
                />
              </Bleed>
              <Box
                background={
                  isDarkMode ? 'surfaceSecondaryElevated' : 'fillSecondary'
                }
                width={{ custom: 90 }}
                height={{ custom: 12 }}
                borderRadius={6}
              />
            </Inline>
            <Box
              background={
                isDarkMode ? 'surfaceSecondaryElevated' : 'fillSecondary'
              }
              width={{ custom: 100 }}
              height={{ custom: 9.3333 }}
              borderRadius={9.3333 / 2}
            />
          </Stack>
        </Column>
      </Columns>
    </Inset>
  );
};

export const OfferRow = ({ offer }: { offer: NftOffer }) => {
  const { navigate } = useNavigation();
  const { colorMode } = useColorMode();
  const bgColor = useBackgroundColor('surfaceSecondaryElevated');

  const isFloorDiffPercentagePositive = offer.floorDifferencePercentage >= 0;
  const dollarAmount = convertAmountToNativeDisplay(
    offer.grossAmount.usd,
    'USD',
    undefined,
    // don't show decimals
    true,
    // abbreviate if amount is >= 10,000
    offer.grossAmount.decimal >= 10_000
  );
  const cryptoAmount = handleSignificantDecimals(
    offer.grossAmount.decimal,
    18,
    // don't show more than 3 decimals
    3,
    undefined,
    // abbreviate if amount is >= 10,000
    offer.grossAmount.decimal >= 10_000
  );

  return (
    <ButtonPressAnimation
      onPress={() => {
        analyticsV2.track(analyticsV2.event.nftOffersOpenedSingleOfferSheet, {
          entryPoint: 'NFTOffersSheet',
          offerPriceUSD: offer.grossAmount.usd,
          nft: {
            collectionAddress: offer.nft.contractAddress,
            tokenId: offer.nft.tokenId,
            network: offer.network,
          },
        });
        navigate(Routes.NFT_SINGLE_OFFER_SHEET, { offer });
      }}
      style={{ marginVertical: 10, marginHorizontal: 20 }}
    >
      <View
        style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}
      >
        <View>
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
                  colorMode === 'dark' || !offer.nft.predominantColor
                    ? globalColors.grey100
                    : offer.nft.predominantColor,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.16,
                shadowRadius: 6,
              }}
            >
              <MaskedView maskElement={<Mask />}>
                <ImgixImage
                  style={{
                    width: NFT_SIZE,
                    height: NFT_SIZE,
                    backgroundColor: bgColor,
                  }}
                  size={CardSize}
                  source={{ uri: offer.nft.imageUrl }}
                />
              </MaskedView>
            </View>
          </View>
          <ImgixImage
            style={{
              alignSelf: 'flex-end',
              width: MARKETPLACE_ORB_SIZE,
              height: MARKETPLACE_ORB_SIZE,
              borderRadius: MARKETPLACE_ORB_SIZE / 2,
              left: -4,
              bottom: -4,
              backgroundColor: bgColor,
              position: 'absolute',
            }}
            source={{ uri: offer.marketplace.imageUrl }}
            size={MARKETPLACE_ORB_SIZE}
          />
        </View>
        <View
          style={{
            paddingHorizontal: 16,
            flexGrow: 1,
            flexShrink: 1,
          }}
        >
          <View style={{ paddingBottom: 10 }}>
            <Text size="17pt" weight="bold" color="label">
              {dollarAmount}
            </Text>
          </View>
          <Text
            size="13pt"
            weight="medium"
            color="labelTertiary"
            ellipsizeMode="tail"
            numberOfLines={1}
          >
            {offer.nft.name}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <View style={{ flexDirection: 'row', paddingBottom: 10 }}>
            <View style={{ marginVertical: -2, paddingRight: 6 }}>
              <CoinIcon
                address={offer.paymentToken.address}
                size={COIN_ICON_SIZE}
                symbol={offer.paymentToken.symbol}
              />
            </View>
            <Text size="17pt" weight="bold" color="label">
              {cryptoAmount}
            </Text>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <Text
              size="13pt"
              weight="medium"
              color={isFloorDiffPercentagePositive ? 'green' : 'labelTertiary'}
            >
              {`${isFloorDiffPercentagePositive ? '+' : ''}${
                offer.floorDifferencePercentage
              }% `}
            </Text>
            <Text size="13pt" weight="medium" color="labelTertiary">
              {i18n.t(
                isFloorDiffPercentagePositive
                  ? i18n.l.nft_offers.sheet.above_floor
                  : i18n.l.nft_offers.sheet.below_floor
              )}
            </Text>
          </View>
        </View>
      </View>
    </ButtonPressAnimation>
  );
};
