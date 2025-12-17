import { memo } from 'react';
import { StyleSheet } from 'react-native';
import { Bleed, Box, Text, useColorMode } from '@/design-system';
import { PolymarketPosition } from '@/features/polymarket/types';
import ImgixImage from '@/components/images/ImgixImage';
import { ButtonPressAnimation } from '@/components/animations';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { OutcomeBadge } from '@/features/polymarket/components/OutcomeBadge';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import LinearGradient from 'react-native-linear-gradient';
import { formatCurrency } from '@/features/perps/utils/formatCurrency';
import { WinOrLossBadge } from '@/features/polymarket/components/WinOrLossBadge';
import { CheckOrXBadge } from '@/features/polymarket/components/CheckOrXBadge';
import { getPositionAccentColor } from '@/features/polymarket/utils/getMarketColor';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';

export const PolymarketPositionRow = memo(function PolymarketPositionRow({ position }: { position: PolymarketPosition }) {
  const { isDarkMode } = useColorMode();
  const accentColor = getPositionAccentColor(position);
  const isPositivePnl = position.cashPnl > 0;
  const pnlColor = isPositivePnl ? 'green' : 'red';

  const outcomeTitle = position.market.groupItemTitle || position.outcome;
  THICK_BORDER_WIDTH;

  return (
    <ButtonPressAnimation
      onPress={() => {
        Navigation.handleAction(Routes.POLYMARKET_EVENT_SCREEN, { eventId: position.eventId, event: position.market.events[0] });
      }}
      scaleTo={0.96}
    >
      <Box paddingHorizontal="20px">
        <GradientBorderView
          borderGradientColors={[opacityWorklet(accentColor, 0.06), opacityWorklet(accentColor, 0)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          borderRadius={24}
          style={{ overflow: 'hidden' }}
        >
          <Box height={66} paddingLeft={'16px'} justifyContent="center">
            <LinearGradient
              colors={[opacityWorklet(accentColor, 0.14), opacityWorklet(accentColor, 0)]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              locations={[0, 0.94]}
              pointerEvents="none"
            />
            <Box flexDirection="row" alignItems="center">
              <Box flexDirection="row" alignItems="center" gap={8} style={styles.flex}>
                <ImgixImage
                  resizeMode="cover"
                  size={28}
                  source={{ uri: position.icon }}
                  style={{ height: 28, width: 28, borderRadius: 9 }}
                />
                <Box gap={12} style={styles.flex}>
                  <Box flexDirection="row" alignItems="center" gap={6}>
                    <Box flexDirection="row" alignItems="center" gap={4} style={styles.flex}>
                      {position.redeemable && <CheckOrXBadge position={position} size={16} fontSize="icon 8px" />}
                      <Text color="label" size="15pt" weight="bold" numberOfLines={1} style={styles.flexShrink}>
                        {outcomeTitle}
                      </Text>
                      {position.market.groupItemTitle && <OutcomeBadge outcome={position.outcome} outcomeIndex={position.outcomeIndex} />}
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
                  {formatCurrency(String(position.currentValue))}
                </Text>
                <Text color={pnlColor} size="13pt" weight="bold">
                  {isPositivePnl ? '+' : '-'} {formatCurrency(String(Math.abs(position.cashPnl)))}
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
