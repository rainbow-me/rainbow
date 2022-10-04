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
import { CoinIcon } from '@/components/coin-icon';
import { useNativeAssetForNetwork } from '@/utils/ethereumUtils';

const CaretIcon = styled(ImgixImage).attrs(({ theme: { colors } }) => ({
  resizeMode: ImgixImage.resizeMode.contain,
  source: CaretImageSource,
  tintColor: colors.blueGreyDark,
}))({
  height: 11,
  top: 0,
  width: 7,
});

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
          <SwapDetailsLabel>
            {lang.t('expanded_state.swap_details.refuel')}
          </SwapDetailsLabel>
        </Column>
        {tradeDetails.refuel ? (
          <>
            <Column width="content">
              <Box paddingRight="2px">
                <CoinIcon
                  mainnet_address={fromNativeAsset?.address}
                  symbol={fromAsset?.symbol}
                  size={20}
                  type={fromNetwork}
                  badgeXPosition={-6}
                  badgeYPosition={0}
                  badgeSize="tiny"
                />
              </Box>
            </Column>
            <Column width="content">
              <CaretIcon />
            </Column>
            <Column width="content">
              <Box paddingLeft="4px">
                <CoinIcon
                  mainnet_address={toNativeAsset?.address}
                  symbol={toAsset?.symbol}
                  size={20}
                  type={toNetwork}
                  badgeXPosition={-6}
                  badgeYPosition={0}
                  badgeSize="tiny"
                />
              </Box>
            </Column>

            <Column width="content">
              <SwapDetailsValue>{`${toAmount.display}${toSymbol}`}</SwapDetailsValue>
            </Column>
          </>
        ) : (
          <Column width="content">
            <Spinner color={colors.blueGreyDark80} size={20} />
          </Column>
        )}
      </Columns>
    </Rows>
  );
}
