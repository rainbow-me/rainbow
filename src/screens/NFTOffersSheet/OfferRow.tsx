import React from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  AccentColorProvider,
  Bleed,
  Box,
  Column,
  Columns,
  Cover,
  globalColors,
  Inline,
  Stack,
  Text,
  useColorMode,
} from '@/design-system';
import { CoinIcon } from '@/components/coin-icon';
import MaskedView from '@react-native-masked-view/masked-view';
import Svg, { Path } from 'react-native-svg';
import { NftOffer } from '@/graphql/__generated__/arc';
import { ImgixImage } from '@/components/images';
import {
  convertAmountToNativeDisplay,
  handleSignificantDecimals,
} from '@/helpers/utilities';
import { ButtonPressAnimation } from '@/components/animations';
import * as i18n from '@/languages';
import { useTheme } from '@/theme';
import Routes from '@/navigation/routesNames';

const NFT_SIZE = 50;
const MARKETPLACE_ORB_SIZE = 18;
const COIN_ICON_SIZE = 16;

const NFTImageMask = () => (
  <Svg width="50" height="50" viewBox="0 0 50 50" fill="none">
    <Path
      d="M4 34C10.6274 34 16 39.3726 16 46C16 46.062 15.9995 46.1238 15.9986 46.1856C15.9774 47.5824 15.9668 48.2808 16.0568 48.5786C16.2869 49.3399 16.606 49.6639 17.3638 49.9055C17.6602 50 18.1735 50 19.2 50H30.8C37.5206 50 40.8809 50 43.4479 48.6921C45.7058 47.5416 47.5416 45.7058 48.6921 43.4479C50 40.8809 50 37.5206 50 30.8V19.2C50 12.4794 50 9.11905 48.6921 6.55211C47.5416 4.29417 45.7058 2.4584 43.4479 1.30792C40.8809 0 37.5206 0 30.8 0H19.2C12.4794 0 9.11905 0 6.55211 1.30792C4.29417 2.4584 2.4584 4.29417 1.30792 6.55211C0 9.11905 0 12.4794 0 19.2V30.8C0 31.8265 0 32.3398 0.0945007 32.6362C0.336104 33.394 0.660065 33.7131 1.42144 33.9432C1.71925 34.0332 2.41764 34.0226 3.81443 34.0014C3.87617 34.0005 3.93803 34 4 34Z"
      fill="black"
    />
  </Svg>
);

export const FakeOfferRow = () => {
  const { colors } = useTheme();
  return (
    <AccentColorProvider color={colors.black}>
      <Columns space="16px" alignVertical="center">
        <Column width="content">
          <Box
            background="accent"
            width={{ custom: NFT_SIZE }}
            height={{ custom: NFT_SIZE }}
            borderRadius={12}
          />
        </Column>
        <Column>
          <Stack space="10px">
            <Box
              background="accent"
              width={{ custom: 70 }}
              height={{ custom: 12 }}
              borderRadius={6}
            />
            <Box
              background="accent"
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
                  background="accent"
                  width={{ custom: COIN_ICON_SIZE }}
                  height={{ custom: COIN_ICON_SIZE }}
                  borderRadius={99}
                />
              </Bleed>
              <Box
                background="accent"
                width={{ custom: 90 }}
                height={{ custom: 12 }}
                borderRadius={6}
              />
            </Inline>
            <Box
              background="accent"
              width={{ custom: 100 }}
              height={{ custom: 9.3333 }}
              borderRadius={9.3333 / 2}
            />
          </Stack>
        </Column>
      </Columns>
    </AccentColorProvider>
  );
};

export const OfferRow = ({ offer }: { offer: NftOffer }) => {
  const { navigate } = useNavigation();
  const { colorMode } = useColorMode();
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
        navigate(Routes.NFT_SINGLE_OFFER_SHEET, { offer });
      }}
    >
      <Columns space="16px" alignVertical="center">
        <Column width="content">
          <Box
            style={{
              shadowColor: globalColors.grey100,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.02,
              shadowRadius: 3,
            }}
          >
            <Box
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
              <MaskedView maskElement={<NFTImageMask />}>
                <Box
                  as={ImgixImage}
                  width={{ custom: NFT_SIZE }}
                  height={{ custom: NFT_SIZE }}
                  size={NFT_SIZE}
                  background="surfaceSecondary"
                  source={{ uri: offer.nft.imageUrl }}
                />
              </MaskedView>
            </Box>
          </Box>
          <Cover>
            <Bleed left={{ custom: 5 }}>
              <Box
                as={ImgixImage}
                width={{ custom: MARKETPLACE_ORB_SIZE }}
                height={{ custom: MARKETPLACE_ORB_SIZE }}
                source={{ uri: offer.marketplace.imageUrl }}
                size={MARKETPLACE_ORB_SIZE}
                marginTop={{
                  custom: NFT_SIZE - MARKETPLACE_ORB_SIZE + 5,
                }}
                marginRight={{
                  custom: NFT_SIZE - MARKETPLACE_ORB_SIZE + 5,
                }}
              />
            </Bleed>
          </Cover>
        </Column>
        <Column>
          <Stack space="10px">
            <Text size="17pt" weight="bold" color="label">
              {dollarAmount}
            </Text>
            <Text
              size="13pt"
              weight="medium"
              color="labelTertiary"
              ellipsizeMode="tail"
              numberOfLines={1}
            >
              {offer.nft.name}
            </Text>
          </Stack>
        </Column>
        <Column width="content">
          <Stack space="10px" alignHorizontal="right">
            <Inline space="6px" alignVertical="center">
              <Bleed vertical="2px">
                <CoinIcon
                  address={offer.paymentToken.address}
                  size={COIN_ICON_SIZE}
                  symbol={offer.paymentToken.symbol}
                />
              </Bleed>
              <Text size="17pt" weight="bold" color="label">
                {cryptoAmount}
              </Text>
            </Inline>
            <Inline>
              <Text
                size="13pt"
                weight="medium"
                color={
                  isFloorDiffPercentagePositive ? 'green' : 'labelTertiary'
                }
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
            </Inline>
          </Stack>
        </Column>
      </Columns>
    </ButtonPressAnimation>
  );
};
