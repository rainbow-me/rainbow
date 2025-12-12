import { StyleSheet } from 'react-native';
import { Bleed, Box, Separator, Text, useColorMode, useForegroundColor } from '@/design-system';
import { PolymarketPosition } from '@/features/polymarket/types';
import { memo, useCallback, useMemo } from 'react';
import { OutcomeBadge } from '@/features/polymarket/components/OutcomeBadge';
import ImgixImage from '@/components/images/ImgixImage';
import { toPercentageWorklet } from '@/safe-math/SafeMath';
import { SkiaBadge } from '@/components/SkiaBadge';
import { ButtonPressAnimation } from '@/components/animations';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import LinearGradient from 'react-native-linear-gradient';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { formatNumber } from '@/helpers/strings';
import { formatCurrency } from '@/features/perps/utils/formatCurrency';
import { getSolidColorEquivalent } from '@/worklets/colors';
import { LiveTokenText } from '@/components/live-token-text/LiveTokenText';
import { getPolymarketTokenId } from '@/state/liveTokens/polymarketAdapter';
import { InnerShadow } from '@/features/polymarket/components/InnerShadow';
import { ButtonPressAnimationTouchEvent } from '@/components/animations/ButtonPressAnimation/types';
import { CheckOrXBadge } from '@/features/polymarket/components/CheckOrXBadge';
import { PositionAction, getPositionAction } from '@/features/polymarket/utils/getPositionAction';

export const PolymarketPositionCard = memo(function PolymarketPositionCard({
  position,
  showActionButton = true,
  showEventTitle = true,
}: {
  position: PolymarketPosition;
  showActionButton?: boolean;
  showEventTitle?: boolean;
}) {
  const { isDarkMode } = useColorMode();
  const green = useForegroundColor('green');
  const red = useForegroundColor('red');
  const wonGreen = isDarkMode ? '#1F9E39' : green;
  const lostRed = isDarkMode ? '#D53F35' : red;
  const accentColor = position.market.color;
  const accentColors = useMemo(() => {
    return {
      opacity0: opacityWorklet(accentColor, 0),
      opacity4: opacityWorklet(accentColor, 0.04),
      opacity6: opacityWorklet(accentColor, 0.06),
      opacity12: opacityWorklet(accentColor, 0.12),
      opacity14: opacityWorklet(accentColor, 0.14),
      opacity20: opacityWorklet(accentColor, 0.2),
      opacity24: opacityWorklet(accentColor, 0.24),
      opacity70: opacityWorklet(accentColor, 0.7),
      opacity100: accentColor,
    };
  }, [accentColor]);
  const buttonBackgroundColor = getSolidColorEquivalent({
    background: accentColors.opacity70,
    foreground: 'rgb(0, 0, 0)',
    opacity: 0.4,
  });

  const redeemable = position.redeemable;
  const isWin = redeemable && position.size === position.currentValue;

  const actionButtonType = useMemo(() => getPositionAction(position), [position]);

  const actionButtonLabel = useMemo(() => {
    switch (actionButtonType) {
      case PositionAction.CLAIM:
        return 'Claim';
      case PositionAction.BURN:
        return 'Burn';
      case PositionAction.CASH_OUT:
        return 'Cash Out';
    }
  }, [actionButtonType]);

  const onPressActionButton = useCallback(
    (e: ButtonPressAnimationTouchEvent) => {
      if (e && 'stopPropagation' in e) {
        e.stopPropagation();
      }
      Navigation.handleAction(Routes.POLYMARKET_MANAGE_POSITION_SHEET, { position });
    },
    [position]
  );

  const outcomeTokenId = useMemo(() => {
    const outcomeIndex = position.outcomes.indexOf(position.outcome);
    const tokenId = position.market.clobTokenIds[outcomeIndex];
    return tokenId;
  }, [position.market.clobTokenIds, position.outcomes, position.outcome]);

  const outcomeTitle = useMemo(() => {
    if (position.market.groupItemTitle) {
      return position.market.groupItemTitle;
    }
    return position.outcome;
  }, [position.market.groupItemTitle, position.outcome]);

  return (
    <GradientBorderView
      borderGradientColors={[accentColors.opacity6, accentColors.opacity0]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      locations={[0, 0.94]}
      borderRadius={24}
    >
      <LinearGradient
        colors={[accentColors.opacity14, accentColors.opacity0]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <Box padding={'16px'}>
        <Box gap={14}>
          {showEventTitle && (
            <GradientBorderView
              borderGradientColors={[accentColors.opacity4, accentColors.opacity0]}
              borderRadius={12}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.75, y: 0 }}
            >
              <LinearGradient
                colors={[accentColors.opacity6, accentColors.opacity0]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0.29, y: 0 }}
                end={{ x: 0.95, y: 0 }}
                pointerEvents="none"
              />
              <Box flexDirection="row" alignItems="center" gap={7} paddingLeft={'8px'} paddingVertical={'6px'}>
                <ImgixImage
                  enableFasterImage
                  resizeMode="cover"
                  size={16}
                  source={{ uri: position.market.events[0].icon }}
                  style={{ height: 16, width: 16, borderRadius: 4 }}
                />
                <Text size="15pt" weight="bold" color="labelSecondary" numberOfLines={1} style={styles.flex}>
                  {position.market.events[0].title}
                </Text>
              </Box>
            </GradientBorderView>
          )}
          <Box gap={12}>
            <Box flexDirection="row" alignItems="center" justifyContent="space-between">
              <Box flexDirection="row" gap={4}>
                <Text size="15pt" weight="semibold" color="labelQuaternary">
                  {'Outcome'}
                </Text>
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
                  {formatCurrency(String(position.currentValue))}
                </Text>
              )}
            </Box>
            <Box flexDirection="row" alignItems="center" justifyContent="space-between" gap={6} style={styles.flex}>
              <Box flexDirection="row" alignItems="center" gap={6} flexShrink={1}>
                {position.marketHasUniqueImage && (
                  <Bleed vertical="4px">
                    <ImgixImage
                      enableFasterImage
                      resizeMode="cover"
                      size={16}
                      source={{ uri: position.icon }}
                      style={{ height: 16, width: 16, borderRadius: 4 }}
                    />
                  </Bleed>
                )}
                {redeemable && (
                  <Bleed vertical="4px">
                    <CheckOrXBadge position={position} size={16} fontSize="icon 8px" />
                  </Bleed>
                )}
                <Text size="17pt" weight="bold" color="label" numberOfLines={1} style={styles.flexShrink}>
                  {outcomeTitle}
                </Text>
                {position.market.groupItemTitle && (
                  <Bleed vertical="4px">
                    <OutcomeBadge outcome={position.outcome} outcomeIndex={position.outcomeIndex} />
                  </Bleed>
                )}
              </Box>
              {!redeemable && (
                <Text
                  size="15pt"
                  weight="bold"
                  color={position.cashPnl > 0 ? 'green' : 'red'}
                  align="right"
                  numberOfLines={1}
                  style={styles.flexShrink0}
                >
                  {formatCurrency(String(position.cashPnl))}
                </Text>
              )}
            </Box>
          </Box>
          <Separator color="separatorTertiary" direction="horizontal" thickness={1} />
          <Box flexDirection="row" alignItems="center" justifyContent="space-between">
            <Box flexDirection="row" alignItems="center" gap={3}>
              <Text size="15pt" weight="bold" color="labelQuaternary">
                {'Odds'}
              </Text>
              <LiveTokenText
                size="15pt"
                weight="bold"
                color="labelSecondary"
                tokenId={getPolymarketTokenId(outcomeTokenId, 'sell')}
                selector={token => `${toPercentageWorklet(token.price)}%`}
                initialValue={`${toPercentageWorklet(position.curPrice)}%`}
              />
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
            <ButtonPressAnimation onPress={onPressActionButton} scaleTo={0.975}>
              <Box
                width="full"
                height={40}
                justifyContent="center"
                alignItems="center"
                borderWidth={2}
                borderColor={{ custom: 'rgba(255, 255, 255, 0.08)' }}
                backgroundColor={buttonBackgroundColor}
                borderRadius={20}
              >
                <InnerShadow borderRadius={20} color={'rgba(255, 255, 255, 0.17)'} blur={6} dx={0} dy={1} />
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
  flexShrink: {
    flexShrink: 1,
  },
  flexShrink0: {
    flexShrink: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
