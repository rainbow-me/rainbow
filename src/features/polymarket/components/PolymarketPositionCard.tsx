import { StyleSheet } from 'react-native';
import { Bleed, Box, Separator, Text, useColorMode } from '@/design-system';
import * as i18n from '@/languages';
import { PolymarketPosition } from '@/features/polymarket/types';
import { memo, useCallback, useMemo } from 'react';
import { OutcomeBadge } from '@/features/polymarket/components/OutcomeBadge';
import ImgixImage from '@/components/images/ImgixImage';
import { mulWorklet, subWorklet, toPercentageWorklet } from '@/safe-math/SafeMath';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import LinearGradient from 'react-native-linear-gradient';
import { formatNumber } from '@/helpers/strings';
import { formatCurrency } from '@/features/perps/utils/formatCurrency';
import { createOpacityPalette, getSolidColorEquivalent } from '@/worklets/colors';
import { LiveTokenText, useLiveTokenValue } from '@/components/live-token-text/LiveTokenText';
import { getPolymarketTokenId } from '@/state/liveTokens/polymarketAdapter';
import { InnerShadow } from '@/features/polymarket/components/InnerShadow';
import { ButtonPressAnimationTouchEvent } from '@/components/animations/ButtonPressAnimation/types';
import { CheckOrXBadge } from '@/features/polymarket/components/CheckOrXBadge';
import { PositionAction, getPositionAction } from '@/features/polymarket/utils/getPositionAction';
import { getPositionTokenId } from '@/features/polymarket/utils/getPositionTokenId';
import { formatPrice } from '@/features/polymarket/utils/formatPrice';
import { getPositionAccentColor } from '@/features/polymarket/utils/getMarketColor';
import { WinOrLossBadge } from '@/features/polymarket/components/WinOrLossBadge';
import { getColorValueForThemeWorklet } from '@/__swaps__/utils/swaps';
import { opacity } from '@/framework/ui/utils/opacity';
import { greaterThan } from '@/helpers/utilities';
import ConditionalWrap from 'conditional-wrap';
import { IS_IOS } from '@/env';
import { getOutcomeDescriptions } from '@/features/polymarket/utils/getOutcomeDescriptions';

export const PolymarketPositionCard = memo(function PolymarketPositionCard({
  position,
  showActionButton = true,
  showEventTitle = true,
  onPress,
}: {
  position: PolymarketPosition;
  showActionButton?: boolean;
  showEventTitle?: boolean;
  onPress?: () => void;
}) {
  const { isDarkMode } = useColorMode();
  const accentColor = getColorValueForThemeWorklet(getPositionAccentColor(position), isDarkMode);
  const accentColors = useMemo(() => {
    return createOpacityPalette(accentColor, [0, 4, 6, 12, 14, 20, 24, 70, 100]);
  }, [accentColor]);
  const eventTitle = position.market.events[0]?.title ?? '';

  const buttonBackgroundColor = isDarkMode
    ? getSolidColorEquivalent({
        background: accentColors.opacity70,
        foreground: 'rgb(0, 0, 0)',
        opacity: 0.4,
      })
    : accentColor;

  const redeemable = position.redeemable;
  const isWin = redeemable && position.size === position.currentValue;
  const actionButtonType = useMemo(() => getPositionAction(position), [position]);

  const actionButtonLabel = useMemo(() => {
    switch (actionButtonType) {
      case PositionAction.CLAIM:
        return i18n.t(i18n.l.predictions.position.claim);
      case PositionAction.CLEAR:
        return i18n.t(i18n.l.predictions.position.clear);
      case PositionAction.CASH_OUT:
        return i18n.t(i18n.l.predictions.position.cash_out);
    }
  }, [actionButtonType]);

  const onPressActionButton = useCallback(
    (e: ButtonPressAnimationTouchEvent) => {
      if (e && 'stopPropagation' in e) {
        e.stopPropagation();
      }
      if (position.redeemable) {
        Navigation.handleAction(Routes.POLYMARKET_MANAGE_POSITION_SHEET, { position });
      } else {
        Navigation.handleAction(Routes.POLYMARKET_SELL_POSITION_SHEET, { position });
      }
    },
    [position]
  );

  const outcomeTokenId = useMemo(() => {
    const outcomeIndex = position.outcomes.indexOf(position.outcome);
    const tokenId = position.market.clobTokenIds[outcomeIndex];
    return tokenId;
  }, [position.market.clobTokenIds, position.outcomes, position.outcome]);

  const outcomeTitle = useMemo(() => {
    const { subtitle } = getOutcomeDescriptions({
      eventTitle,
      market: position.market,
      outcome: position.outcome,
      outcomeIndex: position.outcomeIndex,
    });
    return subtitle;
  }, [eventTitle, position.market, position.outcome, position.outcomeIndex]);

  const livePrice = useLiveTokenValue({
    tokenId: getPositionTokenId(position),
    initialValue: formatPrice(position.curPrice, position.market.orderPriceMinTickSize),
    selector: token => formatPrice(token.price, position.market.orderPriceMinTickSize),
    autoSubscriptionEnabled: !redeemable,
  });

  const livePositionValue = useMemo(() => {
    return mulWorklet(position.size, livePrice);
  }, [position.size, livePrice]);

  const livePnl = useMemo(() => {
    return subWorklet(livePositionValue, position.initialValue);
  }, [livePositionValue, position.initialValue]);

  return (
    <ConditionalWrap condition={!IS_IOS} wrap={children => <Box style={styles.container}>{children}</Box>}>
      <>
        {!IS_IOS && showActionButton && (
          <Box style={styles.actionButtonOverlay}>
            <ButtonPressAnimation onPress={onPressActionButton} scaleTo={0.975} exclusive>
              <Box
                width="full"
                height={40}
                justifyContent="center"
                alignItems="center"
                borderWidth={isDarkMode ? 2 : StyleSheet.hairlineWidth}
                borderColor={{ custom: 'rgba(255, 255, 255, 0.08)' }}
                backgroundColor={buttonBackgroundColor}
                borderRadius={20}
              >
                <InnerShadow borderRadius={20} color={'rgba(255, 255, 255, 0.17)'} blur={6} dx={0} dy={1} />
                <Text size="17pt" weight="heavy" color={'white'}>
                  {actionButtonLabel}
                </Text>
              </Box>
            </ButtonPressAnimation>
          </Box>
        )}
        <ButtonPressAnimation onPress={onPress} scaleTo={onPress ? 0.975 : 1} exclusive>
          <GradientBorderView
            borderGradientColors={
              isDarkMode ? [accentColors.opacity6, accentColors.opacity0] : ['rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 0)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            locations={[0, 0.94]}
            borderRadius={24}
          >
            <LinearGradient
              colors={isDarkMode ? [accentColors.opacity14, accentColors.opacity0] : ['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
            <Box padding={'12px'}>
              <Box gap={14}>
                {showEventTitle && (
                  <GradientBorderView
                    borderGradientColors={isDarkMode ? [accentColors.opacity4, accentColors.opacity0] : ['#F0F2F5', opacity('#F0F2F5', 0)]}
                    borderRadius={12}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0.75, y: 0 }}
                  >
                    <LinearGradient
                      colors={
                        isDarkMode ? [accentColors.opacity6, accentColors.opacity0] : [opacity('#F0F2F5', 0.6), opacity('#F0F2F5', 0)]
                      }
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0.29, y: 0 }}
                      end={{ x: 0.95, y: 0 }}
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
                <Box paddingHorizontal={'4px'} gap={12}>
                  <Box gap={12}>
                    <Box flexDirection="row" alignItems="center" justifyContent="space-between">
                      <Box flexDirection="row" gap={4}>
                        <Text size="15pt" weight="semibold" color="labelQuaternary">
                          {i18n.t(i18n.l.predictions.position.outcome)}
                        </Text>
                      </Box>
                      {redeemable ? (
                        <Bleed bottom="16px">
                          <WinOrLossBadge position={position} height={26} borderWidth={isDarkMode ? 2 : 2 / 3} />
                        </Bleed>
                      ) : (
                        <Text size="17pt" weight="bold" color="label">
                          {formatCurrency(livePositionValue)}
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
                            <OutcomeBadge outcome={position.outcome} outcomeIndex={position.outcomeIndex} color={accentColor} />
                          </Bleed>
                        )}
                      </Box>
                      {!redeemable && (
                        <Text
                          size="15pt"
                          weight="bold"
                          color={greaterThan(livePnl, 0) ? 'green' : 'red'}
                          align="right"
                          numberOfLines={1}
                          style={styles.flexShrink0}
                        >
                          {formatCurrency(livePnl)}
                        </Text>
                      )}
                    </Box>
                  </Box>
                  <Separator color="separatorTertiary" direction="horizontal" thickness={1} />
                  <Box flexDirection="row" alignItems="center" justifyContent="space-between">
                    <Box flexDirection="row" alignItems="center" gap={3}>
                      <Text size="15pt" weight="bold" color="labelQuaternary">
                        {i18n.t(i18n.l.predictions.position.odds)}
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
                        {i18n.t(i18n.l.predictions.position.bet)}
                      </Text>
                      <Text size="15pt" weight="bold" color="labelSecondary">
                        {formatNumber(position.initialValue, { useOrderSuffix: true, decimals: 2, style: '$' })}
                      </Text>
                    </Box>
                    <Box flexDirection="row" alignItems="center" gap={3}>
                      <Text size="15pt" weight="bold" color="labelQuaternary">
                        {isWin ? i18n.t(i18n.l.predictions.position.won) : i18n.t(i18n.l.predictions.position.to_win)}
                      </Text>
                      <Text size="15pt" weight="bold" color="labelSecondary">
                        {formatNumber(position.size, { useOrderSuffix: true, decimals: 2, style: '$' })}
                      </Text>
                    </Box>
                  </Box>
                </Box>
                {showActionButton &&
                  (IS_IOS ? (
                    <ButtonPressAnimation onPress={onPressActionButton} scaleTo={0.975} exclusive>
                      <Box
                        width="full"
                        height={40}
                        justifyContent="center"
                        alignItems="center"
                        borderWidth={isDarkMode ? 2 : StyleSheet.hairlineWidth}
                        borderColor={{ custom: 'rgba(255, 255, 255, 0.08)' }}
                        backgroundColor={buttonBackgroundColor}
                        borderRadius={20}
                      >
                        <InnerShadow borderRadius={20} color={'rgba(255, 255, 255, 0.17)'} blur={6} dx={0} dy={1} />
                        <Text size="17pt" weight="heavy" color={'white'}>
                          {actionButtonLabel}
                        </Text>
                      </Box>
                    </ButtonPressAnimation>
                  ) : (
                    <Box width="full" height={40} />
                  ))}
              </Box>
            </Box>
          </GradientBorderView>
        </ButtonPressAnimation>
      </>
    </ConditionalWrap>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  actionButtonOverlay: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    zIndex: 1,
  },
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
