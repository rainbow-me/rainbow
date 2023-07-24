import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import ConditionalWrap from 'conditional-wrap';
import { TextColor, globalColors } from '@/design-system/color/palettes';
import { ImgixImage } from '@/components/images';
import MaskedView from '@react-native-masked-view/masked-view';
import {
  convertAmountToNativeDisplay,
  getFormattedTimeQuantity,
  handleSignificantDecimals,
} from '@/helpers/utilities';
import { CoinIcon } from '@/components/coin-icon';
import { NftOffer, SortCriterion } from '@/graphql/__generated__/arc';
import {
  AccentColorProvider,
  Box,
  Inline,
  Inset,
  Text,
  useBackgroundColor,
  useColorMode,
} from '@/design-system';
import { RainbowError, logger } from '@/logger';
import { ButtonPressAnimation } from '@/components/animations';
import Routes from '@/navigation/routesNames';
import { analyticsV2 } from '@/analytics';
import { useTheme } from '@/theme';
import { CardSize } from '@/components/unique-token/CardSize';
import { deviceUtils } from '@/utils';
import * as i18n from '@/languages';
import { useRecoilValue } from 'recoil';
import { nftOffersSortAtom } from '@/components/nft-offers/SortMenu';
import { View } from 'react-native';
import OfferMask from '@/assets/offerMask.png';
import { Source } from 'react-native-fast-image';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
export const CELL_HORIZONTAL_PADDING = 7;
const CONTAINER_HORIZONTAL_PADDING = 20;
export const NFT_IMAGE_SIZE =
  (deviceUtils.dimensions.width -
    CONTAINER_HORIZONTAL_PADDING * 2 -
    2 * CELL_HORIZONTAL_PADDING * 3) /
  4;

const Mask = () => (
  <ImgixImage
    size={NFT_IMAGE_SIZE}
    source={OfferMask as Source}
    style={{
      width: NFT_IMAGE_SIZE,
      height: NFT_IMAGE_SIZE,
    }}
  />
);

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

export const Offer = ({ offer }: { offer: NftOffer }) => {
  const { navigate } = useNavigation();
  const { colorMode } = useColorMode();
  const { isDarkMode } = useTheme();

  const surfacePrimaryElevated = useBackgroundColor('surfacePrimaryElevated');
  const surfaceSecondaryElevated = useBackgroundColor(
    'surfaceSecondaryElevated'
  );

  const sortCriterion = useRecoilValue(nftOffersSortAtom);

  const [timeRemaining, setTimeRemaining] = useState(
    offer.validUntil
      ? Math.max(offer.validUntil * 1000 - Date.now(), 0)
      : undefined
  );

  useEffect(() => {
    if (offer.validUntil) {
      const interval = setInterval(() => {
        setTimeRemaining(Math.max(offer.validUntil! * 1000 - Date.now(), 0));
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [offer.validUntil]);

  const cryptoAmount = handleSignificantDecimals(
    offer.grossAmount.decimal,
    18,
    // don't show more than 3 decimals
    3,
    undefined,
    // abbreviate if amount is >= 10,000
    offer.grossAmount.decimal >= 10_000
  );
  const isFloorDiffPercentagePositive = offer.floorDifferencePercentage >= 0;
  const isExpiring =
    timeRemaining !== undefined && timeRemaining <= TWO_HOURS_MS;

  let secondaryTextColor: TextColor;
  let secondaryText;
  switch (sortCriterion) {
    case SortCriterion.TopBidValue:
    case SortCriterion.DateCreated:
      if (isExpiring) {
        secondaryTextColor = 'red';
        secondaryText = timeRemaining
          ? getFormattedTimeQuantity(timeRemaining)
          : i18n.t(i18n.l.nft_offers.card.expired);
      } else {
        secondaryTextColor = 'labelTertiary';
        secondaryText = convertAmountToNativeDisplay(
          offer.grossAmount.usd,
          'USD',
          undefined,
          // don't show decimals
          true,
          // abbreviate if amount is >= 10,000
          offer.grossAmount.usd >= 10_000
        );
      }
      break;
    case SortCriterion.FloorDifferencePercentage:
      if (isExpiring) {
        secondaryTextColor = 'red';
        secondaryText = timeRemaining
          ? getFormattedTimeQuantity(timeRemaining)
          : i18n.t(i18n.l.nft_offers.card.expired);
      } else if (isFloorDiffPercentagePositive) {
        secondaryTextColor = 'green';
        secondaryText = `+${offer.floorDifferencePercentage}%`;
      } else {
        secondaryTextColor = 'labelTertiary';
        secondaryText = `${offer.floorDifferencePercentage}%`;
      }
      break;
    default:
      secondaryTextColor = 'labelTertiary';
      secondaryText = '';
      logger.error(new RainbowError('NFTOffersCard: invalid sort criterion'));
      break;
  }

  return (
    <ButtonPressAnimation
      onPress={() => {
        analyticsV2.track(analyticsV2.event.nftOffersOpenedSingleOfferSheet, {
          entryPoint: 'NFTOffersCard',
          offerPriceUSD: offer.grossAmount.usd,
          nft: {
            collectionAddress: offer.nft.contractAddress,
            tokenId: offer.nft.tokenId,
            network: offer.network,
          },
        });
        navigate(Routes.NFT_SINGLE_OFFER_SHEET, { offer });
      }}
      style={{ marginVertical: 10, marginHorizontal: CELL_HORIZONTAL_PADDING }}
    >
      {isExpiring && (
        <View
          style={{
            width: 19,
            height: 19,
            right: -6,
            top: -6,
            zIndex: 1,
            position: 'absolute',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text size="15pt" weight="bold" align="center" color="red">
            􀐬
          </Text>
        </View>
      )}
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
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.24,
            shadowRadius: 9,
          }}
        >
          <ConditionalWrap
            condition={isExpiring}
            wrap={(children: React.ReactNode) => (
              <MaskedView
                style={{
                  width: NFT_IMAGE_SIZE,
                  height: NFT_IMAGE_SIZE,
                }}
                maskElement={<Mask />}
              >
                {children}
              </MaskedView>
            )}
          >
            <ImgixImage
              source={{ uri: offer.nft.imageUrl }}
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
          </ConditionalWrap>
        </View>
      </View>
      <View
        style={{
          paddingBottom: 7,
          paddingTop: 12,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <CoinIcon
          address={offer.paymentToken.address}
          size={12}
          symbol={offer.paymentToken.symbol}
          style={{ marginRight: 4 }}
        />
        <Text color="label" size="13pt" weight="heavy">
          {cryptoAmount}
        </Text>
      </View>
      <Text color={secondaryTextColor} size="13pt" weight="semibold">
        {secondaryText}
      </Text>
    </ButtonPressAnimation>
  );
};
