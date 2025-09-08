import * as i18n from '@/languages';
import React, { useCallback, useEffect, useState } from 'react';
import { TokenInfoItem } from '../../token-info';
import { Columns } from '@/design-system';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { useTheme } from '@/theme';
import { convertAmountToNativeDisplay, convertRawAmountToRoundedDecimal } from '@/helpers/utilities';
import { useNFTListing } from '@/resources/nfts';
import { UniqueAsset } from '@/entities';
import { fetchReservoirNFTFloorPrice } from '@/resources/nfts/utils';
import { handleReviewPromptAction } from '@/utils/reviewAlert';
import { ReviewPromptAction } from '@/storage/schema';
import { useNativeAsset } from '@/utils/ethereumUtils';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';

const NONE = 'None';

const formatPrice = (price: number | null | undefined, tokenSymbol: string | null | undefined = 'ETH') => {
  if (price === null || price === undefined || !tokenSymbol) return NONE;
  return `${price === 0 ? '< 0.001' : price} ${tokenSymbol}`;
};

export default function NFTBriefTokenInfoRow({ asset }: { asset: UniqueAsset }) {
  const [hasDispatchedAction, setHasDispatchedAction] = useState(false);
  const { colors } = useTheme();

  const { navigate } = useNavigation();

  const nativeCurrency = userAssetsStoreManager(state => state.currency);

  const nativeAsset = useNativeAsset({ chainId: asset.chainId });

  const [floorPrice, setFloorPrice] = useState<string | null>(null);

  useEffect(() => {
    const fetchFloorPrice = async () => {
      try {
        const result = await fetchReservoirNFTFloorPrice(asset);
        if (result !== undefined) {
          setFloorPrice(result);
        } else {
          setFloorPrice(NONE);
        }
      } catch (error) {
        setFloorPrice(NONE);
      }
    };
    if (asset?.floorPrice) {
      setFloorPrice(formatPrice(asset?.floorPrice, nativeAsset?.symbol));
    } else {
      fetchFloorPrice();
    }
  }, [asset, nativeAsset]);

  const { data: listing } = useNFTListing({
    contractAddress: asset?.contractAddress ?? '',
    tokenId: asset?.tokenId,
    chainId: asset?.chainId,
  });

  const listingValue = listing && convertRawAmountToRoundedDecimal(listing?.price, listing?.payment_token?.decimals, 3);

  const [showCurrentPriceInNative, setShowCurrentPriceInNative] = useState(true);
  const toggleCurrentPriceDisplayCurrency = useCallback(
    () => setShowCurrentPriceInNative(!showCurrentPriceInNative),
    [showCurrentPriceInNative, setShowCurrentPriceInNative]
  );

  const [showFloorInNative, setShowFloorInNative] = useState(true);
  const toggleFloorDisplayCurrency = useCallback(() => {
    if (!hasDispatchedAction) {
      handleReviewPromptAction(ReviewPromptAction.NftFloorPriceVisit);
      setHasDispatchedAction(true);
    }
    setShowFloorInNative(!showFloorInNative);
  }, [showFloorInNative, setShowFloorInNative, hasDispatchedAction, setHasDispatchedAction]);

  const handlePressCollectionFloor = useCallback(() => {
    navigate(Routes.EXPLAIN_SHEET, {
      type: 'floor_price',
    });
  }, [navigate]);

  const lastSalePrice = NONE;
  // const lastSalePrice = formatPrice(asset?.lastPrice, asset?.lastSalePaymentToken);

  return (
    <Columns space="19px (Deprecated)">
      {/* @ts-expect-error JavaScript component */}
      <TokenInfoItem
        color={lastSalePrice === NONE && !listingValue ? colors.alpha(colors.whiteLabel, 0.5) : colors.whiteLabel}
        enableHapticFeedback={!!listingValue}
        isNft
        onPress={toggleCurrentPriceDisplayCurrency}
        size="big"
        title={
          listingValue
            ? `􀋢 ${i18n.t(i18n.l.expanded_state.nft_brief_token_info.for_sale)}`
            : i18n.t(i18n.l.expanded_state.nft_brief_token_info.last_sale)
        }
        weight={lastSalePrice === NONE && !listingValue ? 'bold' : 'heavy'}
      >
        {showCurrentPriceInNative || nativeCurrency === nativeAsset?.symbol || !listingValue
          ? listingValue || lastSalePrice
          : convertAmountToNativeDisplay(
              // @ts-expect-error currentPrice is a number?
              parseFloat(currentPrice) * Number(nativeAsset?.price?.value || 0),
              nativeCurrency
            )}
      </TokenInfoItem>
      {/* @ts-expect-error JavaScript component */}
      <TokenInfoItem
        align="right"
        color={floorPrice === NONE ? colors.alpha(colors.whiteLabel, 0.5) : colors.whiteLabel}
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
        {showFloorInNative || nativeCurrency === nativeAsset?.symbol || floorPrice === NONE || floorPrice === null
          ? floorPrice
          : convertAmountToNativeDisplay(
              parseFloat(floorPrice?.[0] === '<' ? floorPrice.substring(2) : floorPrice) * Number(nativeAsset?.price?.value || 0),
              nativeCurrency
            )}
      </TokenInfoItem>
    </Columns>
  );
}
