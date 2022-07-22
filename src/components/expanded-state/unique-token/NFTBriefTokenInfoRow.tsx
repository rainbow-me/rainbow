import lang from 'i18n-js';
import React, { useCallback, useEffect, useState } from 'react';
import assetTypes from '../../../entities/assetTypes';
import { TokenInfoItem } from '../../token-info';
import { Columns } from '@rainbow-me/design-system';
import { apiGetUniqueTokenFloorPrice } from '@rainbow-me/handlers/opensea-api';
import { useAccountSettings } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { useTheme } from '@rainbow-me/theme';
import { convertAmountToNativeDisplay } from '@rainbow-me/utilities';
import { ethereumUtils } from '@rainbow-me/utils';

const NONE = 'None';

export default function NFTBriefTokenInfoRow({
  currentPrice,
  lastPrice,
  lastSalePaymentToken,
  network: assetNetwork,
  urlSuffixForAsset,
}: {
  currentPrice?: number | null;
  lastPrice?: number | null;
  lastSalePaymentToken?: string | null;
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

  const lastSalePrice =
    lastPrice != null
      ? lastPrice === 0
        ? `< 0.001 ${lastSalePaymentToken}`
        : `${lastPrice} ${lastSalePaymentToken}`
      : NONE;
  const priceOfEth = ethereumUtils.getEthPriceUnit() as number;

  return (
    <Columns space="19px">
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
              parseFloat(floorPrice) * priceOfEth,
              nativeCurrency
            )}
      </TokenInfoItem>
    </Columns>
  );
}
