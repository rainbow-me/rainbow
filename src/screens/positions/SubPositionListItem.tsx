import React from 'react';
import { Bleed, Box, Inline, Stack, Text } from '@/design-system';
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

  const greenOrGrey =
    (asset.price?.relative_change_24h || 0) < 0
      ? colors.blueGreyDark60
      : colors.green;

  return (
    <Inline
      key={`${asset.symbol}-${quantity}`}
      alignHorizontal="justify"
      alignVertical="center"
      wrap={false}
    >
      <Box style={{ maxWidth: '60%' }}>
        <Inline alignVertical="center" horizontalSpace={'10px'} wrap={false}>
          <CoinIcon
            address={asset.asset_code}
            type={AssetType.token}
            symbol={asset.symbol}
          />

          <Box style={{ maxWidth: '75%' }}>
            <Stack space="8px">
              <Text size="17pt" weight="bold" color="label" numberOfLines={1}>
                {asset.name}
              </Text>

              <Inline
                alignVertical="center"
                horizontalSpace={'6px'}
                wrap={false}
              >
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
                        numberOfLines={1}
                      >
                        {`${convertAmountToPercentageDisplayWithThreshold(
                          apy
                        )} APY`}
                      </Text>
                    </Box>
                  </Bleed>
                )}
              </Inline>
            </Stack>
          </Box>
        </Inline>
      </Box>
      <Stack space="10px">
        <Text size="17pt" weight="medium" color="label" numberOfLines={1}>
          {native.display}
        </Text>
        <Text
          size="13pt"
          weight="medium"
          color={{ custom: greenOrGrey }}
          align="right"
          numberOfLines={1}
        >
          {convertAmountToPercentageDisplay(
            `${asset.price?.relative_change_24h}`
          )}
        </Text>
      </Stack>
    </Inline>
  );
};
