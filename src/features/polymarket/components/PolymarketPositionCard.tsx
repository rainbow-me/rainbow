import { StyleSheet } from 'react-native';
import { Bleed, Box, Separator, Text, useColorMode, useForegroundColor } from '@/design-system';
import { PolymarketPosition } from '@/features/polymarket/types';
import { memo, useMemo } from 'react';
import { OutcomeBadge } from '@/features/polymarket/components/OutcomeBadge';
import ImgixImage from '@/components/images/ImgixImage';
import { toPercentageWorklet, truncateToDecimals } from '@/safe-math/SafeMath';
import { SkiaBadge } from '@/components/SkiaBadge';
import { ButtonPressAnimation } from '@/components/animations';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import LinearGradient from 'react-native-linear-gradient';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { formatNumber } from '@/helpers/strings';

const ActionButtonType = {
  CLAIM: 'claim',
  BURN: 'burn',
  CASH_OUT: 'cash_out',
} as const;

export const PolymarketPositionCard = memo(function PolymarketPositionCard({
  position,
  showActionButton = true,
}: {
  position: PolymarketPosition;
  showActionButton?: boolean;
}) {
  const { isDarkMode } = useColorMode();
  const green = useForegroundColor('green');
  const red = useForegroundColor('red');
  const wonGreen = isDarkMode ? '#1F9E39' : green;
  const lostRed = isDarkMode ? '#D53F35' : red;
  const redeemable = position.redeemable;

  const isWin = redeemable && position.size === position.currentValue;

  const actionButtonType = useMemo(() => {
    if (redeemable) {
      if (isWin) return ActionButtonType.CLAIM;
      return ActionButtonType.BURN;
    }
    return ActionButtonType.CASH_OUT;
  }, [redeemable, isWin]);

  const actionButtonLabel = useMemo(() => {
    switch (actionButtonType) {
      case ActionButtonType.CLAIM:
        return 'Claim';
      case ActionButtonType.BURN:
        return 'Burn';
      case ActionButtonType.CASH_OUT:
        return 'Cash Out';
    }
  }, [actionButtonType]);

  const actionButtonOnPress = useMemo(() => {
    switch (actionButtonType) {
      case ActionButtonType.CLAIM:
        return () => {
          console.log('claim');
        };
      case ActionButtonType.BURN:
        return () => {
          console.log('burn');
        };
      case ActionButtonType.CASH_OUT:
        return () => {
          Navigation.handleAction(Routes.POLYMARKET_MANAGE_POSITION_SHEET, { position });
        };
    }
  }, [actionButtonType, position]);

  return (
    <GradientBorderView
      borderGradientColors={[opacityWorklet('#DC5CEA', 0.06), opacityWorklet('#DC5CEA', 0)]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      borderRadius={24}
      style={{ overflow: 'hidden' }}
    >
      <LinearGradient
        colors={[opacityWorklet('#DC5CEA', 0.14), opacityWorklet('#DC5CEA', 0)]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        pointerEvents="none"
      />
      <Box padding={'12px'}>
        <Box gap={14}>
          <Box
            borderWidth={1}
            borderColor="separatorTertiary"
            borderRadius={12}
            flexDirection="row"
            alignItems="center"
            gap={7}
            paddingLeft={'8px'}
            paddingVertical={'6px'}
          >
            <ImgixImage
              resizeMode="cover"
              size={16}
              source={{ uri: position.market.events[0].icon }}
              style={{ height: 16, width: 16, borderRadius: 4 }}
            />
            <Text size="15pt" weight="bold" color="labelSecondary" numberOfLines={1} style={styles.flex}>
              {position.market.events[0].title}
            </Text>
          </Box>
          <Box gap={12}>
            <Box flexDirection="row" alignItems="center" justifyContent="space-between">
              <Box flexDirection="row" gap={4}>
                <Text size="15pt" weight="semibold" color="labelQuaternary">
                  {'Outcome'}
                </Text>
                <Bleed vertical="4px">
                  <OutcomeBadge outcome={position.outcome} />
                </Bleed>
              </Box>
              {redeemable ? (
                <Bleed bottom="16px">
                  <SkiaBadge
                    height={26}
                    text={isWin ? 'WON' : 'LOST'}
                    fillColor={isWin ? wonGreen : lostRed}
                    textColor="label"
                    fontSize="15pt"
                    fontWeight="heavy"
                    strokeColor={'rgba(255, 255, 255, 0.12)'}
                    strokeWidth={2}
                  />
                </Bleed>
              ) : (
                <Text size="17pt" weight="bold" color="label">
                  {truncateToDecimals(String(position.currentValue), 2)}
                </Text>
              )}
            </Box>
            <Box>
              <Box flexDirection="row" alignItems="center" justifyContent="space-between">
                <Box flexDirection="row" alignItems="center" gap={6}>
                  {position.marketHasUniqueImage && (
                    <Bleed vertical="4px">
                      <ImgixImage
                        resizeMode="cover"
                        size={16}
                        source={{ uri: position.icon }}
                        style={{ height: 16, width: 16, borderRadius: 4 }}
                      />
                    </Bleed>
                  )}
                  {position.market.groupItemTitle && (
                    <Text size="17pt" weight="bold" color="label">
                      {position.market.groupItemTitle}
                    </Text>
                  )}
                </Box>
                {!redeemable && (
                  <Text size="15pt" weight="bold" color="label">
                    {truncateToDecimals(String(position.cashPnl), 2)}
                  </Text>
                )}
              </Box>
            </Box>
          </Box>
          <Separator color="separatorTertiary" direction="horizontal" thickness={1} />
          <Box flexDirection="row" alignItems="center" justifyContent="space-between">
            <Box flexDirection="row" alignItems="center" gap={3}>
              <Text size="15pt" weight="bold" color="labelQuaternary">
                {'Odds'}
              </Text>
              <Text size="15pt" weight="bold" color="labelSecondary">
                {`${toPercentageWorklet(position.curPrice)}%`}
              </Text>
            </Box>
            <Box flexDirection="row" alignItems="center" gap={3}>
              <Text size="15pt" weight="bold" color="labelQuaternary">
                {'Bet'}
              </Text>
              <Text size="15pt" weight="bold" color="labelSecondary">
                {formatNumber(position.initialValue, { useOrderSuffix: true, decimals: 2, style: '$' })}
              </Text>
            </Box>
            <Box flexDirection="row" alignItems="center" gap={3}>
              <Text size="15pt" weight="bold" color="labelQuaternary">
                {isWin ? 'Won' : 'To Win'}
              </Text>
              <Text size="15pt" weight="bold" color="labelSecondary">
                {formatNumber(position.size, { useOrderSuffix: true, decimals: 2, style: '$' })}
              </Text>
            </Box>
          </Box>
          {showActionButton && (
            <ButtonPressAnimation onPress={actionButtonOnPress} style={{ zIndex: 1000 }}>
              <Box width="full" height={40} justifyContent="center" alignItems="center" background="accent" borderRadius={20}>
                <Text size="17pt" weight="heavy" color="label">
                  {actionButtonLabel}
                </Text>
              </Box>
            </ButtonPressAnimation>
          )}
        </Box>
      </Box>
    </GradientBorderView>
  );
});

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
