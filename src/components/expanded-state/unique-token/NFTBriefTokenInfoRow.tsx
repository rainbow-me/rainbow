import lang from 'i18n-js';
import React, { useCallback, useEffect, useState } from 'react';
import { TokenInfoItem } from '../../token-info';
import { Columns } from '@/design-system';
import { Network } from '@/helpers';
import { useAccountSettings } from '@/hooks';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { useTheme } from '@/theme';
import { convertAmountToNativeDisplay } from '@/helpers/utilities';
import { ethereumUtils } from '@/utils';
import { UniqueAsset } from '@/entities';
import {
  SimplehashFloorPrice,
  SimplehashLastSale,
} from '@/entities/uniqueAssets';
import {
  ETH_PAYMENT_TOKEN_ID,
  fetchSimplehashNftListing,
  OPENSEA_MARKETPLACE_ID,
} from '@/handlers/simplehash';

const NONE = 'None';

const getIsFloorPriceSupported = (network: Network) => {
  switch (network) {
    case Network.mainnet:
      return true;
    default:
      return false;
  }
};

const getRoundedValueFromRawAmount = (
  rawAmount: number | null | undefined,
  decimals: number | null | undefined
) => {
  if (rawAmount && decimals) {
    return Math.round(rawAmount * 10 ** -decimals * 1000) / 1000;
  }
  return null;
};

const getLastSaleString = (lastSale: SimplehashLastSale | null) => {
  const value = getRoundedValueFromRawAmount(
    lastSale?.unit_price,
    lastSale?.payment_token?.decimals
  );
  if (value !== null) {
    const tokenSymbol = lastSale?.payment_token?.symbol;
    if (value === 0) {
      return `< 0.001 ${tokenSymbol}`;
    } else {
      return `${value} ${tokenSymbol}`;
    }
  }
  return NONE;
};

const getOpenSeaFloorPrice = (asset: UniqueAsset) => {
  if (getIsFloorPriceSupported(asset?.network)) {
    const floorPrices = asset?.collection?.floor_prices;
    const openSeaFloorPrice = floorPrices?.find(
      (floorPrice: SimplehashFloorPrice) =>
        floorPrice.marketplace_id === OPENSEA_MARKETPLACE_ID
    );
    if (
      openSeaFloorPrice?.payment_token.payment_token_id === ETH_PAYMENT_TOKEN_ID
    ) {
      const roundedValue = getRoundedValueFromRawAmount(
        openSeaFloorPrice.value,
        openSeaFloorPrice?.payment_token.decimals
      );
      if (roundedValue) {
        return `${roundedValue} ETH`;
      }
    }
  }
  return NONE;
};

export default function NFTBriefTokenInfoRow({
  asset,
}: {
  asset: UniqueAsset;
}) {
  const { colors } = useTheme();

  const { navigate } = useNavigation();

  const { nativeCurrency } = useAccountSettings();

  const openseaFloorPriceEth = asset?.marketplaces.opensea.floorPrice;
  const floorPrice = openseaFloorPriceEth
    ? `${openseaFloorPriceEth} ETH`
    : NONE;

  const [currentPrice, setCurrentPrice] = useState<string | null>();

  useEffect(() => {
    const fetchCurrentPrice = async () => {
      const listing = await fetchSimplehashNftListing(
        asset?.network,
        asset?.contract?.address || '',
        asset?.id
      );
      const price = getRoundedValueFromRawAmount(
        listing?.price,
        listing?.payment_token?.decimals
      );
      if (price !== null) {
        setCurrentPrice(price + ' ETH');
      }
    };

    fetchCurrentPrice();
  }, [asset?.contract?.address, asset?.id, asset?.network]);

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

  const lastSalePrice = getLastSaleString(asset?.lastSale);
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
              parseFloat(floorPrice) * priceOfEth,
              nativeCurrency
            )}
      </TokenInfoItem>
    </Columns>
  );
}
