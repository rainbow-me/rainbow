import { memo, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Bleed, Box, Text, useColorMode } from '@/design-system';
import { PolymarketPosition } from '@/features/polymarket/types';
import ImgixImage from '@/components/images/ImgixImage';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { OutcomeBadge } from '@/features/polymarket/components/OutcomeBadge';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import { getColorValueForThemeWorklet } from '@/__swaps__/utils/swaps';
import { opacity } from '@/framework/ui/utils/opacity';
import LinearGradient from 'react-native-linear-gradient';
import { formatCurrency } from '@/features/perps/utils/formatCurrency';
import { WinOrLossBadge } from '@/features/polymarket/components/WinOrLossBadge';
import { CheckOrXBadge } from '@/features/polymarket/components/CheckOrXBadge';
import { getPositionAccentColor } from '@/features/polymarket/utils/getMarketColor';
import { THICKER_BORDER_WIDTH } from '@/styles/constants';
import { useLiveTokenValue } from '@/components/live-token-text/LiveTokenText';
import { getPositionTokenId } from '@/features/polymarket/utils/getPositionTokenId';
import { formatPrice } from '@/features/polymarket/utils/formatPrice';
import { mulWorklet, subWorklet } from '@/safe-math/SafeMath';

export const PolymarketPositionRow = memo(function PolymarketPositionRow({ position }: { position: PolymarketPosition }) {
  const { isDarkMode } = useColorMode();
  const accentColor = getColorValueForThemeWorklet(getPositionAccentColor(position), isDarkMode);

  const livePrice = useLiveTokenValue({
    tokenId: getPositionTokenId(position),
    initialValue: formatPrice(position.curPrice, position.market.orderPriceMinTickSize),
    selector: token => formatPrice(token.price, position.market.orderPriceMinTickSize),
    autoSubscriptionEnabled: !position.redeemable,
  });

  const livePositionValue = useMemo(() => {
    return mulWorklet(position.size, livePrice);
  }, [position.size, livePrice]);

  const livePnl = useMemo(() => {
    return subWorklet(livePositionValue, position.initialValue);
  }, [livePositionValue, position.initialValue]);

  const displayPnl = position.redeemable ? position.cashPnl : Number(livePnl);
  const isPositivePnl = displayPnl > 0;
  const pnlColor = isPositivePnl ? 'green' : 'red';

  const outcomeTitle = position.market.groupItemTitle || position.outcome;

  return (
    <ButtonPressAnimation
      onPress={() => {
        Navigation.handleAction(Routes.POLYMARKET_EVENT_SCREEN, { eventId: position.eventId, event: position.market.events[0] });
      }}
      scaleTo={0.96}
    >
      <Box paddingHorizontal="20px">
        <GradientBorderView
          borderGradientColors={
            isDarkMode ? [opacity(accentColor, 0.06), opacity(accentColor, 0)] : [opacity('#F0F2F5', 0.8), opacity('#F0F2F5', 0)]
          }
          borderWidth={THICKER_BORDER_WIDTH}
          locations={[0, 0.94]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          borderRadius={24}
        >
          <Box height={66} paddingLeft={{ custom: 14 }} justifyContent="center">
            <LinearGradient
              colors={isDarkMode ? [opacity(accentColor, 0.14), opacity(accentColor, 0)] : [opacity('#F0F2F5', 0.6), opacity('#F0F2F5', 0)]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              locations={[0, 0.94]}
            />
            <Box flexDirection="row" alignItems="center">
              <Box flexDirection="row" alignItems="center" gap={12} style={styles.flex}>
                <ImgixImage
                  resizeMode="cover"
                  size={28}
                  source={{ uri: position.icon }}
                  style={{ height: 28, width: 28, borderRadius: 9 }}
                />
                <Box gap={12} style={styles.flex}>
                  <Box flexDirection="row" alignItems="center" gap={6}>
                    <Box flexDirection="row" alignItems="center" gap={4} style={styles.flex}>
                      {position.redeemable && (
                        <Bleed vertical={'4px'}>
                          <CheckOrXBadge position={position} size={16} fontSize="icon 8px" />
                        </Bleed>
                      )}
                      <Text color="label" size="15pt" weight="bold" numberOfLines={1} style={styles.flexShrink}>
                        {outcomeTitle}
                      </Text>
                      {position.market.groupItemTitle && (
                        <Bleed vertical={'4px'}>
                          <OutcomeBadge outcome={position.outcome} outcomeIndex={position.outcomeIndex} color={accentColor} />
                        </Bleed>
                      )}
                    </Box>
                    {position.redeemable && (
                      <Bleed vertical={'4px'}>
                        <WinOrLossBadge
                          position={position}
                          paddingHorizontal={5}
                          height={18}
                          fontSize="11pt"
                          borderWidth={isDarkMode ? 2 : 2 / 3}
                        />
                      </Bleed>
                    )}
                  </Box>
                  <Box flexDirection="row" alignItems="center" gap={4}>
                    <Text color="labelSecondary" size="13pt" weight="semibold" numberOfLines={1} style={styles.flex}>
                      {position.market.events[0].title}
                    </Text>
                  </Box>
                </Box>
              </Box>
              <Box gap={12} alignItems="flex-end" marginLeft={{ custom: 8 }}>
                <Text color="label" size="15pt" weight="bold">
                  {formatCurrency(livePositionValue)}
                </Text>
                <Text color={pnlColor} size="13pt" weight="bold">
                  {isPositivePnl ? '+' : '-'} {formatCurrency(String(Math.abs(displayPnl)))}
                </Text>
              </Box>
            </Box>
          </Box>
        </GradientBorderView>
      </Box>
    </ButtonPressAnimation>
  );
});

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  flexShrink: {
    flexShrink: 1,
  },
});
