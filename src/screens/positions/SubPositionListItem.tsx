import React from 'react';
import {
  Bleed,
  Box,
  Column,
  Columns,
  Inline,
  Stack,
  Text,
} from '@/design-system';
import { useTheme } from '@/theme';
import { AssetType, ZerionAsset } from '@/entities';
import { NativeDisplay } from '@/resources/defi/PositionsQuery';
import { CoinIcon } from '@/components/coin-icon';
import {
  convertAmountToPercentageDisplay,
  convertAmountToPercentageDisplayWithThreshold,
  convertRawAmountToRoundedDecimal,
} from '@/helpers/utilities';

type Props = {
  asset: ZerionAsset;
  quantity: string;
  apy: string | undefined;
  native: NativeDisplay;
  positionColor: string;
};

export const SubPositionListItem: React.FC<Props> = ({
  asset,
  apy,
  quantity,
  native,
  positionColor,
}) => {
  const { colors } = useTheme();

  const priceChangeColor =
    (asset.price?.relative_change_24h || 0) < 0
      ? colors.blueGreyDark60
      : colors.green;

  return (
    <Columns space={'10px'}>
      <Column width={'content'}>
        <CoinIcon
          address={asset.asset_code}
          type={AssetType.token}
          symbol={asset.symbol}
        />
      </Column>
      <Box justifyContent="center" style={{ height: 40 }}>
        <Stack space="10px">
          <Inline
            key={`${asset.symbol}-${quantity}`}
            alignHorizontal="justify"
            alignVertical="center"
            wrap={false}
          >
            <Columns alignVertical="center">
              <Column>
                <Text size="17pt" weight="bold" color="label" numberOfLines={1}>
                  {asset.name}
                </Text>
              </Column>
              <Column width={'content'}>
                <Text
                  size="17pt"
                  weight="medium"
                  color="label"
                  numberOfLines={1}
                >
                  {native.display}
                </Text>
              </Column>
            </Columns>
          </Inline>
          <Inline
            key={`${asset.symbol}-${quantity}`}
            alignHorizontal="justify"
            alignVertical="center"
            wrap={false}
          >
            <Columns alignVertical="center">
              <Column>
                <Inline alignVertical="center" space={'6px'}>
                  <Box style={{ maxWidth: 150 }}>
                    <Text
                      size="13pt"
                      weight="semibold"
                      color="labelTertiary"
                      numberOfLines={1}
                    >
                      {`${convertRawAmountToRoundedDecimal(
                        quantity,
                        asset.decimals,
                        3
                      )} ${asset.symbol}`}
                    </Text>
                  </Box>
                  {apy && (
                    <Bleed vertical={{ custom: 3 }}>
                      <Box
                        style={{
                          backgroundColor: colors.alpha(positionColor, 0.08),
                          borderRadius: 7,
                          height: 18,
                        }}
                        paddingHorizontal={'5px (Deprecated)'}
                        justifyContent="center"
                      >
                        <Text
                          size="13pt"
                          weight="bold"
                          color={{ custom: positionColor }}
                        >
                          {`${convertAmountToPercentageDisplayWithThreshold(
                            apy
                          )} APY`}
                        </Text>
                      </Box>
                    </Bleed>
                  )}
                </Inline>
              </Column>
              <Column width="content">
                <Text
                  size="13pt"
                  weight="medium"
                  color={{ custom: priceChangeColor }}
                  align="right"
                >
                  {convertAmountToPercentageDisplay(
                    `${asset.price?.relative_change_24h}`
                  )}
                </Text>
              </Column>
            </Columns>
          </Inline>
        </Stack>
      </Box>
    </Columns>
  );
};
