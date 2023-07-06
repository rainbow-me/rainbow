import React from 'react';
import { Bleed, Box, Inline, Stack, Text } from '@/design-system';
import { useTheme } from '@/theme';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { analyticsV2 } from '@/analytics';
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
    >
      <Inline alignVertical="center" horizontalSpace={'10px'}>
        <CoinIcon
          address={asset.asset_code}
          type={AssetType.token}
          symbol={asset.symbol}
        />
        <Stack space="8px">
          <Text size="17pt" weight="bold" color="label">
            {asset.name}
          </Text>
          <Inline alignVertical="center" horizontalSpace={'6px'}>
            <Text size="13pt" weight="semibold" color="labelTertiary">
              {`${convertRawAmountToRoundedDecimal(
                quantity,
                asset.decimals,
                3
              )} ${asset.symbol}`}
            </Text>
            {apy && (
              <Bleed vertical={{ custom: 2 }}>
                <Box
                  style={{
                    backgroundColor: colors.alpha(positionColor, 0.08),
                    borderRadius: 20,
                  }}
                  justifyContent="center"
                  padding="6px"
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
        </Stack>
      </Inline>
      <Stack space="10px">
        <Text size="17pt" weight="medium" color="label">
          {native.display}
        </Text>
        <Text
          size="13pt"
          weight="medium"
          color={{ custom: greenOrGrey }}
          align="right"
        >
          {convertAmountToPercentageDisplay(
            `${asset.price?.relative_change_24h}`
          )}
        </Text>
      </Stack>
    </Inline>
  );
};
