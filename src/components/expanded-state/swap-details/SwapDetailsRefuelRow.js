import lang from 'i18n-js';
import React from 'react';
import { SwapDetailsLabel, SwapDetailsValue } from './SwapDetailsRow';
import { convertRawAmountToBalance } from '@/helpers/utilities';
import { ethereumUtils } from '@/utils';
import { Box, Column, Columns, Rows } from '@/design-system';
import styled from '@/styled-thing';
import { ImgixImage } from '@/components/images';
import CaretImageSource from '@/assets/family-dropdown-arrow.png';
import Spinner from '@/components/Spinner';
import { useTheme } from '@/theme';
import { useNativeAssetForNetwork } from '@/utils/ethereumUtils';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';

const CaretIcon = styled(ImgixImage).attrs(({ theme: { colors } }) => ({
  resizeMode: ImgixImage.resizeMode.contain,
  source: CaretImageSource,
  tintColor: colors.blueGreyDark,
  size: 30,
}))({
  height: 11,
  top: 0,
  width: 7,
});

const ICON_ALIGN_MARGIN = '-8px';

export default function SwapDetailsRefuelRow({ tradeDetails, testID }) {
  const { colors } = useTheme();
  const fromAsset = tradeDetails?.refuel?.fromAsset;
  const toAsset = tradeDetails?.refuel?.toAsset;
  const toAmount = convertRawAmountToBalance(tradeDetails?.refuel?.toAmount, {
    decimals: 18,
  });
  const toSymbol = tradeDetails?.refuel?.toAsset?.symbol;

  const fromNetwork = ethereumUtils.getNetworkFromChainId(fromAsset?.chainId);
  const toNetwork = ethereumUtils.getNetworkFromChainId(toAsset?.chainId);

  const fromNativeAsset = useNativeAssetForNetwork(fromNetwork);
  const toNativeAsset = useNativeAssetForNetwork(toNetwork);

  return (
    <Rows testID={testID}>
      <Columns alignVertical="center" space="4px">
        <Column>
          <SwapDetailsLabel>{lang.t('expanded_state.swap_details.refuel')}</SwapDetailsLabel>
        </Column>
        {tradeDetails.refuel ? (
          <>
            <Column width="content">
              <Box paddingRight="2px" marginTop={ICON_ALIGN_MARGIN} marginBottom={ICON_ALIGN_MARGIN}>
                <RainbowCoinIcon
                  size={20}
                  icon={fromNativeAsset?.icon_url}
                  network={fromNetwork}
                  symbol={fromAsset?.symbol}
                  colors={fromNativeAsset?.colors}
                  ignoreBadge
                />
              </Box>
            </Column>
            <Column width="content">
              <Box marginTop="-4px" marginBottom="-4px">
                <CaretIcon />
              </Box>
            </Column>
            <Column width="content">
              <Box paddingLeft="4px" marginTop={ICON_ALIGN_MARGIN} marginBottom={ICON_ALIGN_MARGIN}>
                <RainbowCoinIcon
                  size={20}
                  icon={toNativeAsset?.icon_url}
                  network={toNetwork}
                  symbol={toAsset?.symbol}
                  colors={toNativeAsset?.colors}
                  ignoreBadge
                />
              </Box>
            </Column>

            <Column width="content">
              <SwapDetailsValue>{`${toAmount.display}${toSymbol}`}</SwapDetailsValue>
            </Column>
          </>
        ) : (
          <Column width="content">
            <Box marginTop={ICON_ALIGN_MARGIN}>
              <Spinner color={colors.blueGreyDark80} size={18} />
            </Box>
          </Column>
        )}
      </Columns>
    </Rows>
  );
}
