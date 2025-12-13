import { memo, useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import Routes from '@/navigation/routesNames';
import { Box, Text, TextShadow, useForegroundColor } from '@/design-system';
import { PanelSheet } from '@/components/PanelSheet/PanelSheet';
import { logger, RainbowError } from '@/logger';
import ImgixImage from '@/components/images/ImgixImage';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { AmountInputCard } from '@/components/amount-input-card/AmountInputCard';
import { HoldToActivateButton } from '@/components/hold-to-activate-button/HoldToActivateButton';
import LinearGradient from 'react-native-linear-gradient';
import { refetchPolymarketStores } from '@/features/polymarket/utils/refetchPolymarketStores';
import { Navigation } from '@/navigation';
import { getSolidColorEquivalent } from '@/worklets/colors';
import { OutcomeBadge } from '@/features/polymarket/components/OutcomeBadge';
import { useNewPositionForm } from '@/features/polymarket/screens/polymarket-new-position-sheet/hooks/useNewPositionForm';
import { formatCurrency } from '@/features/perps/utils/formatCurrency';
import { marketBuyToken } from '@/features/polymarket/utils/orders';
import { subWorklet } from '@/safe-math/SafeMath';
import { collectTradeFee } from '@/features/polymarket/utils/collectTradeFee';

export const PolymarketNewPositionSheet = memo(function PolymarketNewPositionSheet() {
  const {
    params: { market, outcomeIndex },
  } = useRoute<RouteProp<RootStackParamList, typeof Routes.POLYMARKET_NEW_POSITION_SHEET>>();

  const outcome = market.outcomes[outcomeIndex];
  const tokenId = market.clobTokenIds[outcomeIndex];

  const { availableBalance, worstPrice, validation, isValidOrderAmount, amountToWin, outcomeOdds, fee, spread, setBuyAmount, buyAmount } =
    useNewPositionForm({ tokenId });

  const [isProcessing, setIsProcessing] = useState(false);

  const red = useForegroundColor('red');
  const green = useForegroundColor('green');
  const accentColor = market.negRisk ? market.color : outcomeIndex === 0 ? green : red;

  const outcomeTitle = market.events?.[0]?.title || market.question;
  const outcomeSubtitle = useMemo(() => {
    if (market.line) {
      return `${outcome} ${market.line}`;
    }
    if (market.groupItemTitle) {
      return market.groupItemTitle;
    }
    return outcome;
  }, [market.groupItemTitle, outcome, market.line]);

  const handleMarketBuyPosition = useCallback(async () => {
    setIsProcessing(true);
    try {
      const amountToBuy = subWorklet(buyAmount, fee);
      const orderResult = await marketBuyToken({ tokenId, amount: amountToBuy, price: worstPrice });
      const tokensBought = orderResult.takingAmount;
      collectTradeFee(tokensBought);
      refetchPolymarketStores();
      Navigation.goBack();
    } catch (e) {
      logger.error(new RainbowError('[PolymarketNewPositionSheet] Error buying position', e));
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to place bet. Please try again.');
    }
  }, [buyAmount, fee, tokenId, worstPrice]);

  return (
    <PanelSheet innerBorderWidth={1} enableKeyboardAvoidance>
      <View style={StyleSheet.absoluteFill}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} />
        <View style={[StyleSheet.absoluteFill, { opacity: 0.22 }]}>
          <LinearGradient
            colors={[accentColor, opacityWorklet(accentColor, 0)]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            pointerEvents="none"
          />
        </View>
      </View>
      <Box paddingHorizontal="32px" paddingBottom={'24px'} paddingTop={{ custom: 43 }}>
        <Box gap={28}>
          <Text size="26pt" weight="heavy" color="label">
            {'Place Bet'}
          </Text>
          <Box gap={24}>
            <Box
              padding={'20px'}
              backgroundColor={opacityWorklet(accentColor, 0.08)}
              borderRadius={26}
              borderColor={{ custom: opacityWorklet(accentColor, 0.03) }}
              borderWidth={2.5}
            >
              <Box flexDirection="row" alignItems="center" gap={12}>
                <ImgixImage
                  enableFasterImage
                  resizeMode="cover"
                  size={38}
                  source={{ uri: market.icon }}
                  style={{ height: 38, width: 38, borderRadius: 10 }}
                />
                <Box gap={12} style={{ flex: 1 }}>
                  <Text size="15pt" weight="bold" color="labelTertiary" style={{ flex: 1 }}>
                    {outcomeTitle}
                  </Text>
                  <Box flexDirection="row" alignItems="center" gap={4}>
                    <Text size="17pt" weight="bold" color="label">
                      {outcomeSubtitle}
                    </Text>
                    {market.groupItemTitle && <OutcomeBadge outcome={outcome} outcomeIndex={outcomeIndex} />}
                  </Box>
                </Box>
              </Box>
            </Box>
            <AmountInputCard
              availableBalance={availableBalance}
              accentColor={accentColor}
              backgroundColor={opacityWorklet(accentColor, 0.08)}
              onAmountChange={setBuyAmount}
              title="Amount"
              validation={validation}
            />
            <Box flexDirection="row" justifyContent="space-between" paddingHorizontal="16px">
              <Text size="15pt" weight="semibold" color="labelTertiary">
                {'Chance of Outcome'}
              </Text>
              <TextShadow blur={6} shadowOpacity={0.24}>
                <Text size="17pt" weight="heavy" color={{ custom: accentColor }}>
                  {`${outcomeOdds}%`}
                </Text>
              </TextShadow>
            </Box>
            <Box flexDirection="row" justifyContent="space-between" paddingHorizontal="16px">
              <Text size="15pt" weight="semibold" color="labelTertiary">
                {'To Win'}
              </Text>

              <TextShadow blur={6} shadowOpacity={0.24}>
                <Text size="17pt" weight="heavy" color="green">
                  {formatCurrency(amountToWin)}
                </Text>
              </TextShadow>
            </Box>
            <Box flexDirection="row" justifyContent="space-between" paddingHorizontal="16px">
              <Text size="15pt" weight="semibold" color="labelTertiary">
                {'Fees'}
              </Text>
              <TextShadow blur={6} shadowOpacity={0.24}>
                <Text size="17pt" weight="heavy" color="green">
                  {formatCurrency(fee)}
                </Text>
              </TextShadow>
            </Box>
            <Box flexDirection="row" justifyContent="space-between" paddingHorizontal="16px">
              <Text size="15pt" weight="semibold" color="labelTertiary">
                {'Spread'}
              </Text>
              <TextShadow blur={6} shadowOpacity={0.24}>
                <Text size="17pt" weight="heavy" color="green">
                  {formatCurrency(spread)}
                </Text>
              </TextShadow>
            </Box>
            <HoldToActivateButton
              onLongPress={handleMarketBuyPosition}
              label="Hold to Place Bet"
              processingLabel="Placing Bet..."
              isProcessing={isProcessing}
              showBiometryIcon={false}
              backgroundColor={getSolidColorEquivalent({
                background: opacityWorklet(accentColor, 0.7),
                foreground: '#000000',
                opacity: 0.4,
              })}
              disabledBackgroundColor={opacityWorklet(accentColor, 0.12)}
              disabled={!isValidOrderAmount}
              height={48}
              textStyle={{
                color: 'white',
                fontSize: 20,
                fontWeight: '900',
              }}
              progressColor="white"
            />
          </Box>
        </Box>
      </Box>
    </PanelSheet>
  );
});
