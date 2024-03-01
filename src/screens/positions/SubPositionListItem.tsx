import React from 'react';
import { Bleed, Box, Column, Columns, Inline, Stack, Text } from '@/design-system';
import { useTheme } from '@/theme';
import {
  convertAmountToPercentageDisplay,
  convertAmountToPercentageDisplayWithThreshold,
  convertRawAmountToRoundedDecimal,
} from '@/helpers/utilities';
import { NativeDisplay, PositionAsset } from '@/resources/defi/types';
import { useExternalToken } from '@/resources/assets/externalAssetsQuery';
import { useAccountSettings } from '@/hooks';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';

type Props = {
  asset: PositionAsset;
  quantity: string;
  apy: string | undefined;
  native: NativeDisplay;
  positionColor: string;
};

export const SubPositionListItem: React.FC<Props> = ({ asset, apy, quantity, native, positionColor }) => {
  const theme = useTheme();
  const { nativeCurrency } = useAccountSettings();
  const { data: externalAsset } = useExternalToken({ address: asset.asset_code, network: asset.network, currency: nativeCurrency });

  const priceChangeColor = (asset.price?.relative_change_24h || 0) < 0 ? theme.colors.blueGreyDark60 : theme.colors.green;

  return (
    <Columns space={'10px'}>
      <Column width={'content'}>
        <RainbowCoinIcon
          icon={externalAsset?.icon_url}
          network={asset.network}
          symbol={asset.symbol}
          theme={theme}
          colors={externalAsset?.colors}
        />
      </Column>
      <Box justifyContent="center" style={{ height: 40 }}>
        <Stack space="10px">
          <Inline key={`${asset.symbol}-${quantity}`} alignHorizontal="justify" alignVertical="center" wrap={false}>
            <Columns alignVertical="center">
              <Column>
                <Text size="17pt" weight="bold" color="label" numberOfLines={1}>
                  {asset.name}
                </Text>
              </Column>
              <Column width={'content'}>
                <Text size="17pt" weight="medium" color="label" numberOfLines={1}>
                  {native.display}
                </Text>
              </Column>
            </Columns>
          </Inline>
          <Inline key={`${asset.symbol}-${quantity}`} alignHorizontal="justify" alignVertical="center" wrap={false}>
            <Columns alignVertical="center">
              <Column>
                <Inline alignVertical="center" space={'6px'}>
                  <Box style={{ maxWidth: 150 }}>
                    <Text size="13pt" weight="semibold" color="labelTertiary" numberOfLines={1}>
                      {`${convertRawAmountToRoundedDecimal(quantity, asset.decimals, 3)} ${asset.symbol}`}
                    </Text>
                  </Box>
                  {apy && (
                    <Bleed vertical={{ custom: 3 }}>
                      <Box
                        style={{
                          backgroundColor: theme.colors.alpha(positionColor, 0.08),
                          borderRadius: 7,
                          height: 18,
                        }}
                        paddingHorizontal={'5px (Deprecated)'}
                        justifyContent="center"
                      >
                        <Text size="13pt" weight="bold" color={{ custom: positionColor }}>
                          {`${convertAmountToPercentageDisplayWithThreshold(apy)} APY`}
                        </Text>
                      </Box>
                    </Bleed>
                  )}
                </Inline>
              </Column>
              <Column width="content">
                <Text size="13pt" weight="medium" color={{ custom: priceChangeColor }} align="right">
                  {convertAmountToPercentageDisplay(`${asset.price?.relative_change_24h}`)}
                </Text>
              </Column>
            </Columns>
          </Inline>
        </Stack>
      </Box>
    </Columns>
  );
};
