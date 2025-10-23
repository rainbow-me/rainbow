import React from 'react';
import { Bleed, Box, Column, Columns, Inline, Stack, Text, useForegroundColor } from '@/design-system';
import { useTheme } from '@/theme';
import {
  convertAmountToBalanceDisplay,
  convertAmountToPercentageDisplay,
  convertAmountToPercentageDisplayWithThreshold,
} from '@/helpers/utilities';
import { PositionAsset } from '@/features/positions/types';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { ButtonPressAnimation } from '@/components/animations';

type Props = {
  asset: PositionAsset;
  quantity: string;
  apy: string | undefined;
  value: { amount: string; display: string };
  positionColor: string;
  dappVersion?: string;
  name?: string;
  onPress?: () => void;
};

export const PositionListItem: React.FC<Props> = ({ asset, apy, quantity, value, positionColor, dappVersion, name, onPress }) => {
  const theme = useTheme();

  const separatorSecondary = useForegroundColor('separatorSecondary');

  const priceChangeColor = (asset.price?.relative_change_24h || 0) < 0 ? theme.colors.blueGreyDark60 : theme.colors.green;

  const renderContent = () => (
    <Columns space={'10px'}>
      <Column width={'content'}>
        <RainbowCoinIcon
          chainId={asset.chainId}
          color={asset.colors?.primary || asset.colors?.fallback || undefined}
          icon={asset.icon_url}
          symbol={asset.symbol}
        />
      </Column>
      <Box justifyContent="center" style={{ height: 40 }}>
        <Stack space="10px">
          <Inline key={`${asset.symbol}-${quantity}`} alignHorizontal="justify" alignVertical="center" wrap={false}>
            <Columns alignVertical="center">
              <Column>
                <Inline alignVertical="center" space={'6px'}>
                  <Box style={{ maxWidth: 200 }}>
                    <Text size="17pt" weight="semibold" color="label" numberOfLines={1}>
                      {name ? `${asset.symbol} for ${name}` : asset.name}
                    </Text>
                  </Box>
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
                  {value.display}
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
                      {convertAmountToBalanceDisplay(quantity, asset)}
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

  return onPress ? <ButtonPressAnimation onPress={onPress}>{renderContent()}</ButtonPressAnimation> : renderContent();
};
