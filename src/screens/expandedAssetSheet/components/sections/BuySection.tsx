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
import { convertAmountToNativeDisplay, convertNumberToString, convertStringToNumber, roundToSignificant1or5 } from '@/helpers/utilities';
import { useAccountAsset, useAccountSettings } from '@/hooks';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { IS_DEV } from '@/env';
import isTestFlight from '@/helpers/isTestFlight';
import { isL2Chain } from '@/handlers/web3';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';

const GRADIENT_FADE_WIDTH = 24;
const DEFAULT_PERCENTAGES_OF_BALANCE = [0.05, 0.1, 0.25, 0.5, 0.75];
// Ideally this would be different for different currencies, but that would need to be set in the remote config
const DEFAULT_MAINNET_MINIMUM_NATIVE_CURRENCY_AMOUNT = IS_DEV || isTestFlight ? 1 : 10;
const DEFAULT_L2_MINIMUM_NATIVE_CURRENCY_AMOUNT = 1;

const BUTTON_INSET_HORIZONTAL = 24;
const BUTTON_GAP = 10;
const MAX_VISIBLE_BUTTONS = 3;

function getButtonWidth(numberOfButtons: number) {
  const numberOfVisibleButtons = Math.min(numberOfButtons, MAX_VISIBLE_BUTTONS);
  return (DEVICE_WIDTH - BUTTON_INSET_HORIZONTAL * 2 - BUTTON_GAP * (numberOfVisibleButtons - 1)) / numberOfVisibleButtons;
}

function BuyButton({ currencyAmount, numberOfButtons, onPress }: { currencyAmount: number; numberOfButtons: number; onPress: () => void }) {
  const { nativeCurrency } = useAccountSettings();

  const currencyAmountDisplay = useMemo(
    () => convertAmountToNativeDisplay(currencyAmount, nativeCurrency, 2, true),
    [currencyAmount, nativeCurrency]
  );

  const { accentColors } = useExpandedAssetSheetContext();

  return (
    <ButtonPressAnimation scaleTo={0.9} onPress={onPress}>
      <Box
        style={[
          {
            backgroundColor: accentColors.opacity12,
            borderColor: accentColors.opacity6,
            borderWidth: THICK_BORDER_WIDTH,
            borderRadius: 20,
            height: 36,
            paddingHorizontal: 12,
            width: getButtonWidth(numberOfButtons),
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

export const BuySection = memo(function BuySection() {
  const { accentColors, basicAsset: asset } = useExpandedAssetSheetContext();
  const { nativeCurrency } = useAccountSettings();

  const nativeAssetForChain = useUserAssetsStore(state => state.getNativeAssetForChain(asset.chainId));
  const isL2 = isL2Chain({ chainId: asset.chainId });
  const buyWithAsset = useAccountAsset(nativeAssetForChain?.uniqueId ?? '', nativeCurrency);

  // These calculations are done here and not in the buy section because this determines if the buy section itself is visible
  const instantBuyNativeCurrencyAmounts = useMemo(() => {
    let minimumNativeCurrencyAmount = isL2 ? DEFAULT_L2_MINIMUM_NATIVE_CURRENCY_AMOUNT : DEFAULT_MAINNET_MINIMUM_NATIVE_CURRENCY_AMOUNT;
    const buyWithAssetNativeBalance = buyWithAsset?.native?.balance?.amount;
    if (!buyWithAssetNativeBalance) return [];

    const buyWithAssetNativeBalanceNumber = convertStringToNumber(buyWithAssetNativeBalance);

    // Eth is the only native currency where 10 is not a reasonable default minimum amount
    if (nativeCurrency === 'ETH') {
      minimumNativeCurrencyAmount = isL2 ? 0.001 : 0.01;
    }

    const amounts = new Set(
      DEFAULT_PERCENTAGES_OF_BALANCE.map(percentage => roundToSignificant1or5(percentage * buyWithAssetNativeBalanceNumber)).filter(
        amount => amount >= minimumNativeCurrencyAmount && amount < buyWithAssetNativeBalanceNumber
      )
    );
    return Array.from(amounts);
  }, [buyWithAsset, nativeCurrency, isL2]);

  const hasBuyOptions = instantBuyNativeCurrencyAmounts.length > 0;

  // This should never happen, as the buy section is only visible if there is a buy with asset
  if (!buyWithAsset) return;

  return (
    <Box gap={12}>
      <Stack space="4px">
        <Box style={{ opacity: hasBuyOptions ? 1 : 0.5 }}>
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
                  {i18n.t(i18n.l.expanded_state.sections.buy.pay_with)}
                </Text>
              </TextShadow>
              <Box alignItems="center" flexDirection="row" gap={8}>
                <RainbowCoinIcon
                  size={16}
                  chainId={buyWithAsset.chainId}
                  color={buyWithAsset.color}
                  icon={buyWithAsset.icon_url}
                  symbol={buyWithAsset.symbol}
                />
                <TextShadow blur={12} shadowOpacity={0.24}>
                  <Text align="right" weight="semibold" size="17pt" color="accent">
                    {buyWithAsset.symbol}
                  </Text>
                </TextShadow>
              </Box>
            </Box>
          </Row>
        </Box>
        <Row>
          <Box alignItems="center" flexDirection="row" gap={12} width={'full'}>
            <IconContainer height={10} width={20}>
              <Text weight="medium" align="center" size="15pt" color="labelTertiary">
                {hasBuyOptions ? '􀣽' : '􀇿'}
              </Text>
            </IconContainer>
            <Text weight="semibold" size="17pt" color="labelTertiary" style={{ flex: 1 }}>
              {hasBuyOptions
                ? i18n.t(i18n.l.expanded_state.sections.buy.available_balance)
                : i18n.t(i18n.l.expanded_state.sections.buy.low_balance)}
            </Text>
            <Text align="right" weight="semibold" size="17pt" color="labelTertiary">
              {buyWithAsset.native?.balance?.display}
            </Text>
          </Box>
        </Row>
      </Stack>
      {hasBuyOptions && (
        <Bleed horizontal="24px">
          <ScrollView
            horizontal
            contentContainerStyle={{ gap: 9, paddingHorizontal: 24 }}
            scrollEnabled={instantBuyNativeCurrencyAmounts.length >= MAX_VISIBLE_BUTTONS}
            showsHorizontalScrollIndicator={false}
          >
            {instantBuyNativeCurrencyAmounts.map(currencyAmount => (
              <BuyButton
                key={currencyAmount}
                currencyAmount={currencyAmount}
                numberOfButtons={instantBuyNativeCurrencyAmounts.length}
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
      )}
      {!hasBuyOptions && (
        <ButtonPressAnimation
          scaleTo={0.96}
          onPress={() => {
            navigateToSwaps({
              inputAsset: transformRainbowTokenToParsedSearchAsset(buyWithAsset),
              outputAsset: transformRainbowTokenToParsedSearchAsset(asset),
            });
          }}
        >
          <Box
            padding="12px"
            alignItems="center"
            borderColor={{ custom: accentColors.opacity6 }}
            backgroundColor={accentColors.opacity12}
            borderWidth={THICK_BORDER_WIDTH}
            borderRadius={20}
            width={'full'}
          >
            <Text weight="semibold" size="17pt" color="labelTertiary">
              {i18n.t(i18n.l.expanded_state.sections.buy.open_swaps)}
            </Text>
          </Box>
        </ButtonPressAnimation>
      )}
    </Box>
  );
});
