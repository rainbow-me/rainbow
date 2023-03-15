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
  convertRawAmountToDecimalFormat,
} from '@/helpers/utilities';
import { ethereumUtils } from '@/utils';
import { UniqueAsset } from '@/entities';
import { fetchSimpleHashNFTListing } from '@/resources/nfts/simplehash';

const NONE = 'None';

export default function NFTBriefTokenInfoRow({
  asset,
}: {
  asset: UniqueAsset;
}) {
  const { colors } = useTheme();

  const { navigate } = useNavigation();

  const { nativeCurrency } = useAccountSettings();

  const floorPrice =
    asset?.floorPriceEth !== undefined
      ? `${asset?.floorPriceEth !== '0' ? asset?.floorPriceEth : '< 0.001'} ETH`
      : NONE;

  const [currentPrice, setCurrentPrice] = useState<string | null>();

  useEffect(() => {
    const fetchCurrentPrice = async () => {
      const listing = await fetchSimpleHashNFTListing(
        asset?.network,
        asset?.asset_contract.address || '',
        asset?.id
      );
      if (listing?.price) {
        const price = convertRawAmountToDecimalFormat(
          listing?.price,
          listing?.payment_token?.decimals,
          3
        );
        setCurrentPrice((price !== '0' ? price : '< 0.001') + ' ETH');
      }
    };

    fetchCurrentPrice();
  }, [asset?.asset_contract.address, asset?.id, asset?.network]);

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

  const lastSalePrice =
    asset?.lastPrice !== undefined
      ? `${asset?.lastPrice !== '0' ? asset?.lastPrice : '< 0.001'} ${
          asset?.lastSalePaymentToken
        }`
      : NONE;
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
