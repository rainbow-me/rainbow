import React, { memo, useMemo } from 'react';
import * as i18n from '@/languages';
import { Bleed, Box, IconContainer, Stack, Text, TextShadow } from '@/design-system';
import { useExpandedAssetSheetContext } from '../../context/ExpandedAssetSheetContext';
import { ScrollView } from 'react-native-gesture-handler';
import { ButtonPressAnimation } from '@/components/animations';
import { Row } from '../shared/Row';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { InteractionManager } from 'react-native';
import { navigateToSwaps } from '@/__swaps__/screens/Swap/navigateToSwaps';
import { transformRainbowTokenToParsedSearchAsset } from '@/__swaps__/utils/assets';
import { convertAmountToNativeDisplay, convertNumberToString } from '@/helpers/utilities';
import { ParsedAddressAsset } from '@/entities';
import { useAccountSettings } from '@/hooks';

const GRADIENT_FADE_WIDTH = 24;

function BuyButton({ currencyAmount, onPress }: { currencyAmount: number; onPress: () => void }) {
  const { nativeCurrency } = useAccountSettings();

  const currencyAmountDisplay = useMemo(
    () => convertAmountToNativeDisplay(currencyAmount, nativeCurrency, 2, true),
    [currencyAmount, nativeCurrency]
  );

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
            {currencyAmountDisplay}
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

  return (
    <Box gap={12}>
      <Stack space="4px">
        <Row highlighted>
          <Box alignItems="center" flexDirection="row" gap={12} width={'full'}>
            <IconContainer height={10} width={20}>
              <TextShadow blur={12} shadowOpacity={0.24}>
                <Text weight="medium" align="center" size="15pt" color="accent">
                  {'􁾫'}
                </Text>
              </TextShadow>
            </IconContainer>
            <TextShadow containerStyle={{ flex: 1 }} blur={12} shadowOpacity={0.24}>
              <Text weight="semibold" size="17pt" color="accent">
                {i18n.t(i18n.l.expanded_state.sections.buy.pay_with, { assetSymbol: buyWithAsset.symbol })}
              </Text>
            </TextShadow>
            <RainbowCoinIcon
              size={20}
              chainId={buyWithAsset.chainId}
              color={buyWithAsset.color}
              icon={buyWithAsset.icon_url}
              symbol={buyWithAsset.symbol}
            />
          </Box>
        </Row>
        <Row>
          <Box alignItems="center" flexDirection="row" gap={12} width={'full'}>
            <IconContainer height={10} width={20}>
              <TextShadow blur={12} shadowOpacity={0.24}>
                <Text weight="medium" align="center" size="15pt" color="labelTertiary">
                  􀣽
                </Text>
              </TextShadow>
            </IconContainer>
            <TextShadow containerStyle={{ flex: 1 }} blur={12} shadowOpacity={0.24}>
              <Text weight="semibold" size="17pt" color="labelTertiary">
                {i18n.t(i18n.l.expanded_state.sections.buy.available_balance)}
              </Text>
            </TextShadow>
            <TextShadow blur={12} shadowOpacity={0.24}>
              <Text weight="semibold" size="17pt" color="labelTertiary">
                {buyWithAsset.native?.balance?.display}
              </Text>
            </TextShadow>
          </Box>
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
