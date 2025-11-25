import { memo } from 'react';
import { StyleSheet } from 'react-native';
import { Bleed, Box, Text } from '@/design-system';
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

export const PolymarketPositionRow = memo(function PolymarketPositionRow({ position }: { position: PolymarketPosition }) {
  const accentColor = position.market.color;
  const isPositivePnl = position.cashPnl > 0;
  const pnlColor = isPositivePnl ? 'green' : 'red';
  position.market.events[0];

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
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
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
                  <Text color="label" size="13pt" weight="semibold" numberOfLines={1} style={styles.flex}>
                    {position.market.events[0].title}
                  </Text>
                  <Box flexDirection="row" alignItems="center" gap={4}>
                    {position.market.groupItemTitle && (
                      <Text color="labelSecondary" size="13pt" weight="semibold" numberOfLines={1}>
                        {position.market.groupItemTitle}
                      </Text>
                    )}
                    <Bleed vertical="3px">
                      <OutcomeBadge outcome={position.outcome} />
                    </Bleed>
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
});
