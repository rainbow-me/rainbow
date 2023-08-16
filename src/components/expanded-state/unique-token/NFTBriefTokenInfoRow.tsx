import lang from 'i18n-js';
import React, { useCallback, useEffect, useState } from 'react';
import { TokenInfoItem } from '../../token-info';
import { Columns } from '@/design-system';
import { useAccountSettings } from '@/hooks';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { useTheme } from '@/theme';
import {
  convertAmountToNativeDisplay,
  convertRawAmountToRoundedDecimal,
} from '@/helpers/utilities';
import { ethereumUtils } from '@/utils';
import { useNFTListing } from '@/resources/nfts';
import { UniqueAsset } from '@/entities';
import { fetchReservoirNFTFloorPrice } from '@/resources/nfts/utils';

const NONE = 'None';

const formatPrice = (
  price: number | null | undefined,
  tokenSymbol: string | null | undefined = 'ETH'
) => {
  if (price === null || price === undefined || !tokenSymbol) return NONE;
  return `${price === 0 ? '< 0.001' : price} ${tokenSymbol}`;
};

export default function NFTBriefTokenInfoRow({
  asset,
}: {
  asset: UniqueAsset;
}) {
  const { colors } = useTheme();

  const { navigate } = useNavigation();

  const { nativeCurrency } = useAccountSettings();

  const [floorPrice, setFloorPrice] = useState<string | null>(null);

  useEffect(() => {
    const fetchFloorPrice = async () => {
      const result = await fetchReservoirNFTFloorPrice(asset);
      if (result) {
        setFloorPrice(result);
      } else {
        setFloorPrice(formatPrice(asset?.floorPriceEth, 'ETH'));
      }
    };
    fetchFloorPrice();
  }, [asset]);

  const { data: listing } = useNFTListing({
    contractAddress: asset?.asset_contract?.address ?? '',
    tokenId: asset?.id,
    network: asset?.network,
  });

  const listingValue =
    listing &&
    convertRawAmountToRoundedDecimal(
      listing?.price,
      listing?.payment_token?.decimals,
      3
    );

  const currentPrice = asset?.currentPrice ?? listingValue;

  const [showCurrentPriceInEth, setShowCurrentPriceInEth] = useState(true);
  const toggleCurrentPriceDisplayCurrency = useCallback(
    () => setShowCurrentPriceInEth(!showCurrentPriceInEth),
    [showCurrentPriceInEth, setShowCurrentPriceInEth]
  );

  const [showFloorInEth, setShowFloorInEth] = useState(true);
  const toggleFloorDisplayCurrency = useCallback(
    () => setShowFloorInEth(!showFloorInEth),
    [showFloorInEth, setShowFloorInEth]
  );

  const handlePressCollectionFloor = useCallback(() => {
    navigate(Routes.EXPLAIN_SHEET, {
      type: 'floor_price',
    });
  }, [navigate]);

  const lastSalePrice = formatPrice(
    asset?.lastPrice,
    asset?.lastSalePaymentToken
  );
  const priceOfEth = ethereumUtils.getEthPriceUnit() as number;

  return (
    <Columns space="19px (Deprecated)">
      {/* @ts-expect-error JavaScript component */}
      <TokenInfoItem
        color={
          lastSalePrice === NONE && !currentPrice
            ? colors.alpha(colors.whiteLabel, 0.5)
            : colors.whiteLabel
        }
        enableHapticFeedback={!!currentPrice}
        isNft
        onPress={toggleCurrentPriceDisplayCurrency}
        size="big"
        title={
          currentPrice
            ? `􀋢 ${lang.t('expanded_state.nft_brief_token_info.for_sale')}`
            : lang.t('expanded_state.nft_brief_token_info.last_sale')
        }
        weight={lastSalePrice === NONE && !currentPrice ? 'bold' : 'heavy'}
      >
        {showCurrentPriceInEth || nativeCurrency === 'ETH' || !currentPrice
          ? currentPrice || lastSalePrice
          : convertAmountToNativeDisplay(
              // @ts-expect-error currentPrice is a number?
              parseFloat(currentPrice) * priceOfEth,
              nativeCurrency
            )}
      </TokenInfoItem>
      {/* @ts-expect-error JavaScript component */}
      <TokenInfoItem
        align="right"
        color={
          floorPrice === NONE
            ? colors.alpha(colors.whiteLabel, 0.5)
            : colors.whiteLabel
        }
        enableHapticFeedback={floorPrice !== NONE}
        isNft
        loading={!floorPrice}
        onInfoPress={handlePressCollectionFloor}
        onPress={toggleFloorDisplayCurrency}
        showInfoButton
        size="big"
        title="Floor price"
        weight={floorPrice === NONE ? 'bold' : 'heavy'}
      >
        {showFloorInEth ||
        nativeCurrency === 'ETH' ||
        floorPrice === NONE ||
        floorPrice === null
          ? floorPrice
          : convertAmountToNativeDisplay(
              parseFloat(
                floorPrice?.[0] === '<' ? floorPrice.substring(2) : floorPrice
              ) * priceOfEth,
              nativeCurrency
            )}
      </TokenInfoItem>
    </Columns>
  );
}
