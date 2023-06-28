import React, { useEffect, useState } from 'react';
import { Linking, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { SimpleSheet } from '@/components/sheet/SimpleSheet';
import {
  AccentColorProvider,
  BackgroundProvider,
  Box,
  Inline,
  Inset,
  Separator,
  Text,
  Columns,
  Column,
  useForegroundColor,
} from '@/design-system';
import { ImgixImage } from '@/components/images';
import {
  getFormattedTimeQuantity,
  convertAmountToNativeDisplay,
  handleSignificantDecimals,
} from '@/helpers/utilities';
import * as i18n from '@/languages';
import { NftOffer } from '@/graphql/__generated__/arc';
import { CoinIcon } from '@/components/coin-icon';
import { ButtonPressAnimation } from '@/components/animations';
import { useNavigation } from '@/navigation';
import { IS_ANDROID } from '@/env';
import ConditionalWrap from 'conditional-wrap';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

function Row({
  symbol,
  label,
  value,
}: {
  symbol: string;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Box height={{ custom: 36 }} alignItems="center">
      <Columns>
        <Column>
          <Inline space="4px" alignVertical="center">
            <Box width={{ custom: 28 }}>
              <Text color="labelTertiary" size="15pt" weight="medium">
                {symbol}
              </Text>
            </Box>

            <Text color="labelTertiary" size="17pt" weight="medium">
              {label}
            </Text>
          </Inline>
        </Column>
        <Column>{value}</Column>
      </Columns>
    </Box>
  );
}

export function NFTSingleOfferSheet() {
  const { params } = useRoute();
  const { setParams } = useNavigation();

  const { offer } = params as { offer: NftOffer };

  const [height, setHeight] = useState(0);

  useEffect(() => {
    setParams({ longFormHeight: height });
  }, [height, setParams]);

  const [timeRemaining, setTimeRemaining] = useState(
    offer.validUntil
      ? Math.max(offer.validUntil * 1000 - Date.now(), 0)
      : undefined
  );

  const isFloorDiffPercentagePositive = offer.floorDifferencePercentage >= 0;
  const listPrice = handleSignificantDecimals(
    offer.grossAmount.decimal,
    18,
    // don't show more than 3 decimals
    3,
    undefined,
    // abbreviate if amount is >= 10,000
    offer.grossAmount.decimal >= 10_000
  );
  const floorPrice = handleSignificantDecimals(
    offer.floorPrice.amount.decimal,
    18,
    // don't show more than 3 decimals
    3,
    undefined,
    // abbreviate if amount is >= 10,000
    offer.grossAmount.decimal >= 10_000
  );
  const netCurrency = convertAmountToNativeDisplay(
    offer.netAmount.usd,
    'USD',
    undefined,
    // don't show decimals
    false,
    // abbreviate if amount is >= 10,000
    offer.netAmount.decimal >= 10_000
  );
  const netCrypto = handleSignificantDecimals(
    offer.netAmount.decimal,
    18,
    // don't show more than 3 decimals
    3,
    undefined,
    // abbreviate if amount is >= 10,000
    offer.netAmount.decimal >= 10_000
  );

  useEffect(() => {
    if (offer.validUntil) {
      const interval = setInterval(() => {
        setTimeRemaining(Math.max(offer.validUntil * 1000 - Date.now(), 0));
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [offer.validUntil]);

  const isExpiring =
    timeRemaining !== undefined && timeRemaining <= TWO_HOURS_MS;
  const isExpired = timeRemaining === 0;
  const time = timeRemaining
    ? getFormattedTimeQuantity(timeRemaining)
    : undefined;
  const buttonColorFallback = useForegroundColor('accent');

  return (
    <BackgroundProvider color="surfaceSecondary">
      {({ backgroundColor }) => (
        <SimpleSheet
          backgroundColor={backgroundColor as string}
          scrollEnabled={false}
        >
          <View onLayout={e => setHeight(e.nativeEvent.layout.height)}>
            <Inset top="32px" horizontal="28px" bottom="52px">
              <Inset bottom={{ custom: 36 }}>
                <Text color="label" align="center" size="20pt" weight="heavy">
                  {i18n.t(i18n.l.nft_offers.single_offer_sheet.title)}
                </Text>
                <Inset top="10px">
                  {timeRemaining !== undefined && (
                    <Inline
                      space="4px"
                      alignHorizontal="center"
                      alignVertical="center"
                    >
                      <Text
                        color={
                          isExpiring || isExpired ? 'red' : 'labelTertiary'
                        }
                        align="center"
                        size="13pt"
                        weight="semibold"
                      >
                        {isExpired ? '􀇾' : '􀐫'}
                      </Text>
                      <Text
                        color={
                          isExpiring || isExpired ? 'red' : 'labelTertiary'
                        }
                        align="center"
                        size="15pt"
                        weight="semibold"
                      >
                        {isExpired
                          ? i18n.t(i18n.l.nft_offers.single_offer_sheet.expired)
                          : i18n.t(
                              i18n.l.nft_offers.single_offer_sheet.expires_in,
                              {
                                timeLeft: time!,
                              }
                            )}
                      </Text>
                    </Inline>
                  )}
                </Inset>
              </Inset>

              <Box alignItems="center">
                <ConditionalWrap
                  condition={!!offer.nft.predominantColor}
                  wrap={(children: React.ReactNode) => (
                    <AccentColorProvider color={offer.nft.predominantColor!}>
                      {children}
                    </AccentColorProvider>
                  )}
                >
                  <Box
                    as={ImgixImage}
                    background="surfacePrimary"
                    source={{ uri: offer.nft.imageUrl }}
                    width={{ custom: 160 }}
                    height={{ custom: 160 }}
                    borderRadius={16}
                    size={160}
                    shadow={offer.nft.predominantColor ? '30px accent' : '30px'}
                  />
                </ConditionalWrap>
              </Box>

              <Inset top={{ custom: 40 }} bottom="24px">
                <Columns>
                  <Column>
                    <Text color="label" size="17pt" weight="bold">
                      {offer.nft.name}
                    </Text>
                    <Inset top="10px">
                      <Text color="labelTertiary" size="13pt" weight="medium">
                        {offer.nft.collectionName}
                      </Text>
                    </Inset>
                  </Column>
                  <Column>
                    <Inline
                      space="4px"
                      alignVertical="center"
                      alignHorizontal="right"
                    >
                      <CoinIcon
                        address={offer.paymentToken.address}
                        size={16}
                        symbol={offer.paymentToken.symbol}
                      />

                      <Text
                        color="label"
                        align="right"
                        size="17pt"
                        weight="bold"
                      >
                        {listPrice} {offer.paymentToken.symbol}
                      </Text>
                    </Inline>

                    <Inset top="6px">
                      <Inline alignHorizontal="right">
                        <Text
                          size="13pt"
                          weight="medium"
                          color={
                            isFloorDiffPercentagePositive
                              ? 'green'
                              : 'labelTertiary'
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
                    </Inset>
                  </Column>
                </Columns>
              </Inset>

              <Separator color="separatorTertiary" />

              <Inset top="24px">
                <Row
                  symbol="􀐾"
                  label={i18n.t(
                    i18n.l.nft_offers.single_offer_sheet.floor_price
                  )}
                  value={
                    <Inline
                      space="4px"
                      alignVertical="center"
                      alignHorizontal="right"
                    >
                      <CoinIcon
                        address={offer.paymentToken.address}
                        size={16}
                        symbol={offer.paymentToken.symbol}
                      />

                      <Text
                        color="labelSecondary"
                        align="right"
                        size="17pt"
                        weight="medium"
                      >
                        {floorPrice} {offer.paymentToken.symbol}
                      </Text>
                    </Inline>
                  }
                />

                <Row
                  symbol="􀍩"
                  label={i18n.t(
                    i18n.l.nft_offers.single_offer_sheet.marketplace
                  )}
                  value={
                    <Inline
                      space="4px"
                      alignVertical="center"
                      alignHorizontal="right"
                    >
                      <Box
                        as={ImgixImage}
                        background="surfacePrimary"
                        source={{ uri: offer.marketplace.imageUrl }}
                        width={{ custom: 16 }}
                        height={{ custom: 16 }}
                        borderRadius={16}
                        size={16}
                        // shadow is way off on android idk why
                        shadow={IS_ANDROID ? undefined : '30px accent'}
                      />

                      <Text
                        color="labelSecondary"
                        align="right"
                        size="17pt"
                        weight="medium"
                      >
                        {offer.marketplace.name}
                      </Text>
                    </Inline>
                  }
                />

                <Row
                  symbol="􀘾"
                  label={i18n.t(
                    i18n.l.nft_offers.single_offer_sheet.marketplace_fees,
                    { marketplace: offer.marketplace.name }
                  )}
                  value={
                    <Text
                      color="labelSecondary"
                      align="right"
                      size="17pt"
                      weight="medium"
                    >
                      {(offer.feesPercentage / 100).toFixed(1)}%
                    </Text>
                  }
                />

                <Row
                  symbol="􀣶"
                  label={i18n.t(
                    i18n.l.nft_offers.single_offer_sheet.creator_royalties
                  )}
                  value={
                    <Text
                      color="labelSecondary"
                      align="right"
                      size="17pt"
                      weight="medium"
                    >
                      {offer.royaltiesPercentage}%
                    </Text>
                  }
                />

                {/* <Row
                symbol="􀖅"
                label={i18n.t(i18n.l.nft_offers.single_offer_sheet.receive)}
                value={
                  <Text
                    color="labelSecondary"
                    align="right"
                    size="17pt"
                    weight="medium"
                  >
                    {offer.paymentToken.symbol}
                  </Text>
                }
              /> */}
              </Inset>

              <Separator color="separatorTertiary" />

              <Inset vertical="24px">
                <Columns alignVertical="center">
                  <Column>
                    <Text color="label" size="17pt" weight="bold">
                      {i18n.t(i18n.l.nft_offers.single_offer_sheet.proceeds)}
                    </Text>
                  </Column>
                  <Column>
                    <Inline
                      space="4px"
                      alignVertical="center"
                      alignHorizontal="right"
                    >
                      <CoinIcon
                        address={offer.paymentToken.address}
                        size={16}
                        symbol={offer.paymentToken.symbol}
                      />

                      <Text
                        color="label"
                        align="right"
                        size="17pt"
                        weight="bold"
                      >
                        {netCrypto} {offer.paymentToken.symbol}
                      </Text>
                    </Inline>

                    <Inset top="10px">
                      <Text
                        color="labelTertiary"
                        align="right"
                        size="13pt"
                        weight="medium"
                      >
                        {netCurrency}
                      </Text>
                    </Inset>
                  </Column>
                </Columns>
              </Inset>

              <AccentColorProvider
                color={offer.nft.predominantColor || buttonColorFallback}
              >
                {/* @ts-ignore js component */}
                <Box
                  as={ButtonPressAnimation}
                  background="accent"
                  height="46px"
                  // @ts-ignore
                  disabled={isExpired}
                  width="full"
                  borderRadius={99}
                  justifyContent="center"
                  alignItems="center"
                  style={{ overflow: 'hidden' }}
                  onPress={() => Linking.openURL(offer.url)}
                >
                  <Text color="label" align="center" size="17pt" weight="heavy">
                    {i18n.t(
                      isExpired
                        ? i18n.l.nft_offers.single_offer_sheet.offer_expired
                        : i18n.l.nft_offers.single_offer_sheet.view_offer
                    )}
                  </Text>
                </Box>
              </AccentColorProvider>
            </Inset>
          </View>
        </SimpleSheet>
      )}
    </BackgroundProvider>
  );
}
