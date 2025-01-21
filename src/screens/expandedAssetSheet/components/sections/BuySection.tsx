import React, { memo } from 'react';
import { Bleed, Box, IconContainer, Inline, Stack, Text, TextShadow } from '@/design-system';
import { useExpandedAssetSheetContext } from '../../context/ExpandedAssetSheetContext';
import { ScrollView } from 'react-native-gesture-handler';
import { ButtonPressAnimation } from '@/components/animations';
import { Row } from '../shared/Row';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { useTheme } from '@/theme';
import { InteractionManager } from 'react-native';
import { TokenColors } from '@/graphql/__generated__/metadata';
import { navigateToSwaps } from '@/__swaps__/screens/Swap/navigateToSwaps';
import { transformRainbowTokenToParsedSearchAsset } from '@/__swaps__/utils/assets';
import { convertNumberToString } from '@/helpers/utilities';
import { ParsedAddressAsset } from '@/entities';

const GRADIENT_FADE_WIDTH = 24;

function BuyButton({ currencyAmount, onPress }: { currencyAmount: number; onPress: () => void }) {
  const { accentColors } = useExpandedAssetSheetContext();

  return (
    <ButtonPressAnimation scaleTo={0.96} onPress={onPress}>
      <Box
        style={[
          {
            backgroundColor: accentColors.opacity12,
            borderColor: accentColors.opacity6,
            borderWidth: 1.33,
            borderRadius: 20,
            padding: 12,
            width: 112,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        <TextShadow blur={12} shadowOpacity={0.24}>
          <Text weight="heavy" size="17pt" color="accent">
            ${currencyAmount}
          </Text>
        </TextShadow>
      </Box>
    </ButtonPressAnimation>
  );
}

export const BuySection = memo(function BuySection({
  instantBuyAmounts,
  buyWithAsset,
}: {
  instantBuyAmounts: number[];
  buyWithAsset: ParsedAddressAsset;
}) {
  const { accentColors, basicAsset: asset } = useExpandedAssetSheetContext();
  const theme = useTheme();

  return (
    <Box gap={12}>
      <Stack space="4px">
        <Row highlighted>
          <Inline alignVertical="center" space="12px">
            <IconContainer height={10} width={20}>
              <TextShadow blur={12} shadowOpacity={0.24}>
                <Text weight="medium" align="center" size="15pt" color="accent">
                  {'􁾫'}
                </Text>
              </TextShadow>
            </IconContainer>
            <TextShadow blur={12} shadowOpacity={0.24}>
              <Text weight="semibold" size="17pt" color="accent">
                {`Pay with ${buyWithAsset.symbol}`}
              </Text>
            </TextShadow>
            <RainbowCoinIcon
              size={20}
              chainId={buyWithAsset.chainId}
              colors={buyWithAsset.colors as TokenColors}
              icon={buyWithAsset.icon_url}
              ignoreBadge
              symbol={buyWithAsset.symbol}
              theme={theme}
            />
          </Inline>
        </Row>
        <Row>
          <Inline alignVertical="center" space="12px">
            <IconContainer height={10} width={20}>
              <TextShadow blur={12} shadowOpacity={0.24}>
                <Text weight="medium" align="center" size="15pt" color="labelTertiary">
                  􀣽
                </Text>
              </TextShadow>
            </IconContainer>
            <TextShadow blur={12} shadowOpacity={0.24}>
              <Text weight="semibold" size="17pt" color="labelTertiary">
                {'Available Balance'}
              </Text>
            </TextShadow>
            <TextShadow blur={12} shadowOpacity={0.24}>
              <Text weight="semibold" size="17pt" color="labelTertiary">
                {buyWithAsset.native?.balance?.display}
              </Text>
            </TextShadow>
          </Inline>
        </Row>
      </Stack>
      <Bleed horizontal="24px">
        <ScrollView horizontal contentContainerStyle={{ gap: 9, paddingHorizontal: 24 }} showsHorizontalScrollIndicator={false}>
          {instantBuyAmounts.map(currencyAmount => (
            <BuyButton
              key={currencyAmount}
              currencyAmount={currencyAmount}
              onPress={() => {
                InteractionManager.runAfterInteractions(async () => {
                  const priceOfBuyWithAsset = buyWithAsset.price?.value;

                  if (!priceOfBuyWithAsset) return;

                  const inputAssetAmount = currencyAmount / priceOfBuyWithAsset;

                  navigateToSwaps({
                    inputAsset: transformRainbowTokenToParsedSearchAsset(buyWithAsset),
                    outputAsset: transformRainbowTokenToParsedSearchAsset(asset),
                    inputAmount: convertNumberToString(inputAssetAmount),
                  });
                });
              }}
            />
          ))}
        </ScrollView>
        <EasingGradient
          endColor={accentColors.background}
          startColor={accentColors.background}
          startPosition={'left'}
          endPosition={'right'}
          startOpacity={0}
          endOpacity={1}
          style={{ position: 'absolute', right: 0, height: '100%', width: GRADIENT_FADE_WIDTH }}
        />
        <EasingGradient
          endColor={accentColors.background}
          startColor={accentColors.background}
          startPosition={'right'}
          endPosition={'left'}
          startOpacity={0}
          endOpacity={1}
          style={{ position: 'absolute', left: 0, height: '100%', width: GRADIENT_FADE_WIDTH }}
        />
      </Bleed>
    </Box>
  );
});
