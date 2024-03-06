import React, { useEffect, useState } from 'react';
import { useNavigation } from '@/navigation';
import ConditionalWrap from 'conditional-wrap';
import { TextColor, globalColors } from '@/design-system/color/palettes';
import { ImgixImage } from '@/components/images';
import MaskedView from '@react-native-masked-view/masked-view';
import { convertAmountToNativeDisplay, getFormattedTimeQuantity, handleSignificantDecimals } from '@/helpers/utilities';
import { NftOffer, SortCriterion } from '@/graphql/__generated__/arc';
import { AccentColorProvider, Box, Inline, Inset, Text, useBackgroundColor, useColorMode } from '@/design-system';
import { RainbowError, logger } from '@/logger';
import { ButtonPressAnimation } from '@/components/animations';
import Routes from '@/navigation/routesNames';
import { analyticsV2 } from '@/analytics';
import { useTheme } from '@/theme';
import { CardSize } from '@/components/unique-token/CardSize';
// import { deviceUtils } from '@/utils';
import * as i18n from '@/languages';
import { useRecoilValue } from 'recoil';
import { nftOffersSortAtom } from '@/components/nft-offers/SortMenu';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { useExternalToken } from '@/resources/assets/externalAssetsQuery';
import { useAccountSettings } from '@/hooks';
import { Network } from '@/networks/types';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
export const CELL_HORIZONTAL_PADDING = 7;
// const CONTAINER_HORIZONTAL_PADDING = 20;
// have to remove this bc it svg mask doesn't scale with it
// export const NFT_IMAGE_SIZE =
//   (deviceUtils.dimensions.width -
//     CONTAINER_HORIZONTAL_PADDING * 2 -
//     2 * CELL_HORIZONTAL_PADDING * 3) /
//   4;
export const NFT_IMAGE_SIZE = 78;

const Mask = () => (
  <Svg width="78" height="78" viewBox="0 0 78 78">
    <Path
      d="M77.9991 17.5233C77.9978 16.7078 77.9972 16.3001 77.9385 16.0639C77.7232 15.1985 77.3429 14.8188 76.4771 14.605C76.2409 14.5466 75.6569 14.5466 74.4887 14.5466V14.5466C68.3941 14.5466 63.4534 9.60592 63.4534 3.51125V3.51125C63.4534 2.34314 63.4534 1.75909 63.395 1.52285C63.1812 0.657103 62.8015 0.276763 61.936 0.0615435C61.6999 0.00281707 61.2922 0.00216367 60.4767 0.000856855C59.942 0 59.3837 0 58.8 0H19.2C12.4794 0 9.11905 0 6.55211 1.30792C4.29417 2.4584 2.4584 4.29417 1.30792 6.55211C0 9.11905 0 12.4794 0 19.2V58.8C0 65.5206 0 68.8809 1.30792 71.4479C2.4584 73.7058 4.29417 75.5416 6.55211 76.6921C9.11905 78 12.4794 78 19.2 78H58.8C65.5206 78 68.8809 78 71.4479 76.6921C73.7058 75.5416 75.5416 73.7058 76.6921 71.4479C78 68.8809 78 65.5206 78 58.8V19.2C78 18.6163 78 18.058 77.9991 17.5233Z"
      fill="black"
    />
  </Svg>
);

export const FakeOffer = () => {
  const { colors } = useTheme();
  return (
    <AccentColorProvider color={colors.skeleton}>
      <Inset vertical="10px" horizontal={{ custom: 7 }}>
        <Box background="accent" width={{ custom: NFT_IMAGE_SIZE }} height={{ custom: NFT_IMAGE_SIZE }} borderRadius={12} />
        <Box paddingBottom={{ custom: 7 }} paddingTop={{ custom: 12 }}>
          <Inline space="4px" alignVertical="center">
            <Box background="accent" width={{ custom: 12 }} height={{ custom: 12 }} borderRadius={6} />
            <Box background="accent" width={{ custom: 50 }} height={{ custom: 9.3333 }} borderRadius={9.3333 / 2} />
          </Inline>
        </Box>
        <Box background="accent" width={{ custom: 50 }} height={{ custom: 9.3333 }} borderRadius={9.3333 / 2} />
      </Inset>
    </AccentColorProvider>
  );
};

export const Offer = ({ offer }: { offer: NftOffer }) => {
  const { navigate } = useNavigation();
  const { colorMode } = useColorMode();
  const theme = useTheme();
  const { nativeCurrency } = useAccountSettings();
  const { data: externalAsset } = useExternalToken({
    address: offer.paymentToken.address,
    network: offer.network as Network,
    currency: nativeCurrency,
  });

  const surfacePrimaryElevated = useBackgroundColor('surfacePrimaryElevated');
  const surfaceSecondaryElevated = useBackgroundColor('surfaceSecondaryElevated');

  const sortCriterion = useRecoilValue(nftOffersSortAtom);

  const [timeRemaining, setTimeRemaining] = useState(offer.validUntil ? Math.max(offer.validUntil * 1000 - Date.now(), 0) : undefined);

  useEffect(() => {
    if (offer.validUntil) {
      const interval = setInterval(() => {
        setTimeRemaining(Math.max(offer.validUntil! * 1000 - Date.now(), 0));
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [offer.validUntil]);

  useEffect(() => setTimeRemaining(offer.validUntil ? Math.max(offer.validUntil * 1000 - Date.now(), 0) : undefined), [offer.validUntil]);

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
  const isExpiring = timeRemaining !== undefined && timeRemaining <= TWO_HOURS_MS;

  let secondaryTextColor: TextColor;
  let secondaryText;
  switch (sortCriterion) {
    case SortCriterion.TopBidValue:
    case SortCriterion.DateCreated:
      if (isExpiring) {
        secondaryTextColor = 'red';
        secondaryText = timeRemaining ? getFormattedTimeQuantity(timeRemaining) : i18n.t(i18n.l.nft_offers.card.expired);
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
        secondaryText = timeRemaining ? getFormattedTimeQuantity(timeRemaining) : i18n.t(i18n.l.nft_offers.card.expired);
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
          offerValueUSD: offer.grossAmount.usd,
          offerValue: offer.grossAmount.decimal,
          offerCurrency: {
            symbol: offer.paymentToken.symbol,
            contractAddress: offer.paymentToken.address,
          },
          floorDifferencePercentage: offer.floorDifferencePercentage,
          nft: {
            contractAddress: offer.nft.contractAddress,
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
            right: -5.5,
            top: -5.5,
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
            shadowColor: colorMode === 'dark' || !offer.nft.predominantColor ? globalColors.grey100 : offer.nft.predominantColor,
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
                backgroundColor: theme.isDarkMode ? surfaceSecondaryElevated : surfacePrimaryElevated,
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
        <View style={{ marginRight: 4 }}>
          <RainbowCoinIcon
            size={12}
            icon={externalAsset?.icon_url}
            network={offer?.network as Network}
            symbol={offer.paymentToken.symbol}
            theme={theme}
            colors={externalAsset?.colors}
            ignoreBadge
          />
        </View>
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
