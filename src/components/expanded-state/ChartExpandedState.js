import { find } from 'lodash';
import React, { useRef } from 'react';
import { useColorForAsset, useUniswapAssetsInWallet } from '../../hooks';
import {
  BuyActionButton,
  SendActionButton,
  SheetActionButtonRow,
  SheetDivider,
  SlackSheet,
  SwapActionButton,
} from '../sheet';
import {
  TokenInfoBalanceValue,
  TokenInfoItem,
  TokenInfoRow,
  TokenInfoSection,
} from '../token-info';
import ChartState from './chart/ChartState';
import AssetInputTypes from '@rainbow-me/helpers/assetInputTypes';

const heightWithChart = android ? 630 : 606;
const heightWithoutChart = 309;

export const ChartExpandedStateSheetHeight =
  heightWithChart + (android ? 40 : 0);

export default function ChartExpandedState({ asset }) {
  const color = useColorForAsset(asset);

  const { uniswapAssetsInWallet } = useUniswapAssetsInWallet();
  const showSwapButton = find(uniswapAssetsInWallet, [
    'uniqueId',
    asset.uniqueId,
  ]);

  const needsEth = asset.address === 'eth' && asset.balance.amount === '0';

  const duration = useRef(0);

  if (duration.current === 0) {
    duration.current = 300;
  }

  return (
    <SlackSheet
      additionalTopPadding={android}
      contentHeight={ChartExpandedStateSheetHeight}
      scrollEnabled={false}
    >
      <ChartState
        asset={asset}
        heightWithChart={heightWithChart}
        heightWithoutChart={heightWithoutChart}
      />
      <SheetDivider />
      <TokenInfoSection>
        <TokenInfoRow>
          <TokenInfoItem asset={asset} title="Balance">
            <TokenInfoBalanceValue />
          </TokenInfoItem>
          {asset?.native?.price.display && (
            <TokenInfoItem title="Value" weight="bold">
              {asset?.native?.balance.display}
            </TokenInfoItem>
          )}
        </TokenInfoRow>
      </TokenInfoSection>
      {needsEth ? (
        <SheetActionButtonRow>
          <BuyActionButton
            color={color}
            isCharts
            radiusAndroid={24}
            radiusWrapperStyle={{ flex: 1 }}
            wrapperProps={{
              containerStyle: { flex: 1 },
              style: { flex: 1 },
            }}
          />
        </SheetActionButtonRow>
      ) : (
        <SheetActionButtonRow>
          {showSwapButton && (
            <SwapActionButton
              color={color}
              inputType={AssetInputTypes.in}
              isCharts
              radiusAndroid={24}
              radiusWrapperStyle={{ flex: 1, marginRight: 10 }}
              wrapperProps={{
                containerStyle: { flex: 1 },
                style: { flex: 1 },
              }}
            />
          )}
          <SendActionButton
            color={color}
            isCharts
            radiusAndroid={24}
            radiusWrapperStyle={{ flex: 1, marginLeft: 10 }}
            wrapperProps={{
              containerStyle: { flex: 1 },
              style: { flex: 1 },
            }}
          />
        </SheetActionButtonRow>
      )}
    </SlackSheet>
  );
}
