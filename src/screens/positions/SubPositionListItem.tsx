import React from 'react';
import { Bleed, Box, Column, Columns, Inline, Stack, Text, useForegroundColor } from '@/design-system';
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
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

type Props = {
  asset: PositionAsset;
  quantity: string;
  apy: string | undefined;
  native: NativeDisplay;
  positionColor: string;
  dappVersion?: string;
};

export const SubPositionListItem: React.FC<Props> = ({ asset, apy, quantity, native, positionColor, dappVersion }) => {
  const theme = useTheme();
  const { nativeCurrency } = useAccountSettings();
  const chainId = useBackendNetworksStore.getState().getChainsIdByName()[asset.network];
  const { data: externalAsset } = useExternalToken({ address: asset.asset_code, chainId, currency: nativeCurrency });

  const separatorSecondary = useForegroundColor('separatorSecondary');

  const priceChangeColor = (asset.price?.relative_change_24h || 0) < 0 ? theme.colors.blueGreyDark60 : theme.colors.green;

  return (
    <Columns space={'10px'}>
      <Column width={'content'}>
        <RainbowCoinIcon
          chainId={chainId}
          color={externalAsset?.colors?.primary || externalAsset?.colors?.fallback || undefined}
          icon={externalAsset?.icon_url}
          symbol={asset.symbol}
        />
      </Column>
      <Box justifyContent="center" style={{ height: 40 }}>
        <Stack space="10px">
          <Inline key={`${asset.symbol}-${quantity}`} alignHorizontal="justify" alignVertical="center" wrap={false}>
            <Columns alignVertical="center">
              <Column>
                <Inline alignVertical="center" space={'6px'}>
                  <Text size="17pt" weight="semibold" color="label" numberOfLines={1}>
                    {asset.name}
                  </Text>
                  {dappVersion && (
                    <Box
                      borderRadius={7}
                      padding={{ custom: 4.5 }}
                      style={{
                        borderColor: separatorSecondary,
                        borderWidth: 1.5,
                        // offset vertical padding
                        marginVertical: -11,
                      }}
                    >
                      <Text color="labelQuaternary" size="13pt" weight="bold">
                        {dappVersion}
                      </Text>
                    </Box>
                  )}
                </Inline>
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
