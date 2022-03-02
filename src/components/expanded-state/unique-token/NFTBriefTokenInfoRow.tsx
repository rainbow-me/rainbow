import React, { useCallback, useEffect, useState } from 'react';

import assetTypes from '../../../entities/assetTypes';
import { TokenInfoItem } from '../../token-info';
import { useTheme } from '@rainbow-me/context';
import { Columns } from '@rainbow-me/design-system';
import { apiGetUniqueTokenFloorPrice } from '@rainbow-me/handlers/opensea-api';
import { useAccountSettings } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { convertAmountToNativeDisplay } from '@rainbow-me/utilities';
import { ethereumUtils } from '@rainbow-me/utils';

export default function NFTBriefTokenInfoRow({
  currentPrice,
  lastPrice,
  network: assetNetwork,
  urlSuffixForAsset,
}: {
  currentPrice?: number | null;
  lastPrice?: string | null;
  network?: string;
  urlSuffixForAsset: string;
}) {
  const { colors } = useTheme();

  const { navigate } = useNavigation();

  const { nativeCurrency, network } = useAccountSettings();

  const [floorPrice, setFloorPrice] = useState<string | null>(null);
  useEffect(() => {
    assetNetwork !== assetTypes.polygon &&
      apiGetUniqueTokenFloorPrice(network, urlSuffixForAsset).then(result => {
        setFloorPrice(result);
      });
  }, [assetNetwork, network, urlSuffixForAsset]);

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

  const priceOfEth = ethereumUtils.getEthPriceUnit() as number;

  const lastSalePrice = lastPrice || 'None';

  return (
    <Columns space="19px">
      {/* @ts-expect-error JavaScript component */}
      <TokenInfoItem
        color={
          lastSalePrice === 'None' && !currentPrice
            ? colors.alpha(colors.whiteLabel, 0.5)
            : colors.whiteLabel
        }
        enableHapticFeedback={!!currentPrice}
        isNft
        onPress={toggleCurrentPriceDisplayCurrency}
        size="big"
        title={currentPrice ? '􀋢 For sale' : 'Last sale price'}
        weight={lastSalePrice === 'None' && !currentPrice ? 'bold' : 'heavy'}
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
          floorPrice === 'None'
            ? colors.alpha(colors.whiteLabel, 0.5)
            : colors.whiteLabel
        }
        enableHapticFeedback={floorPrice !== 'None'}
        isNft
        loading={!floorPrice}
        onInfoPress={handlePressCollectionFloor}
        onPress={toggleFloorDisplayCurrency}
        showInfoButton
        size="big"
        title="Floor price"
        weight={floorPrice === 'None' ? 'bold' : 'heavy'}
      >
        {showFloorInEth ||
        nativeCurrency === 'ETH' ||
        floorPrice === 'None' ||
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
