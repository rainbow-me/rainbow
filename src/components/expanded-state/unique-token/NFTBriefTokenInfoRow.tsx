import lang from 'i18n-js';
import React, { useCallback, useState } from 'react';
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
import { NFT, NFTMarketplaceId } from '@/resources/nfts/types';

const NONE = 'None';

const formatPrice = (
  price: number | null | undefined,
  tokenSymbol: string | null | undefined = 'ETH'
) => {
  if (price === null || price === undefined || !tokenSymbol) return NONE;
  return `${price === 0 ? '< 0.001' : price} ${tokenSymbol}`;
};

export default function NFTBriefTokenInfoRow({ asset }: { asset: NFT }) {
  const { colors } = useTheme();

  const { navigate } = useNavigation();

  const { nativeCurrency } = useAccountSettings();

  const { data: listing } = useNFTListing({
    contractAddress: asset?.asset_contract?.address ?? '',
    tokenId: asset?.tokenId,
    network: asset?.network,
  });

  const currentPrice =
    listing &&
    convertRawAmountToRoundedDecimal(
      listing?.price,
      listing?.payment_token?.decimals,
      3
    );

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

  const floorPriceData = asset?.collection?.floorPrices.filter(
    floorPrice => floorPrice.marketplaceId === NFTMarketplaceId.OpenSea
  )?.[0];

  const floorPrice = formatPrice(
    convertRawAmountToRoundedDecimal(
      listing?.price,
      listing?.payment_token?.decimals,
      3
    ),
    floorPriceData?.paymentToken?.symbol
  );

  const canConvertFloorPrice = floorPriceData?.paymentToken?.symbol === 'ETH';

  const lastSalePrice = formatPrice(
    convertRawAmountToRoundedDecimal(
      asset?.lastSale?.value,
      asset?.lastSale?.paymentToken?.decimals,
      3
    ),
    asset?.lastSale?.paymentToken?.symbol
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
        enableHapticFeedback={floorPrice !== NONE && canConvertFloorPrice}
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
        floorPrice === null ||
        !canConvertFloorPrice
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
