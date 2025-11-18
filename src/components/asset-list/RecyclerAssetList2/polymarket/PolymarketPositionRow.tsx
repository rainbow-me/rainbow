import { memo } from 'react';
import { StyleSheet } from 'react-native';
import { Bleed, Box, Text } from '@/design-system';
import { PolymarketPosition } from '@/features/polymarket/types';
import ImgixImage from '@/components/images/ImgixImage';
import { truncateToDecimals } from '@/safe-math/SafeMath';
import { ButtonPressAnimation } from '@/components/animations';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { OutcomeBadge } from '@/features/polymarket/components/OutcomeBadge';

export const PolymarketPositionRow = memo(function PolymarketPositionRow({ position }: { position: PolymarketPosition }) {
  return (
    <ButtonPressAnimation
      onPress={() => {
        Navigation.handleAction(Routes.POLYMARKET_EVENT_SCREEN, { eventId: position.eventId });
      }}
    >
      <Box paddingHorizontal="20px">
        <Box height={68} paddingHorizontal={'16px'} background="surfaceSecondaryElevated" borderRadius={24} justifyContent="center">
          <Box flexDirection="row" alignItems="center">
            <Box flexDirection="row" alignItems="center" gap={8} style={styles.flex}>
              <ImgixImage resizeMode="cover" size={28} source={{ uri: position.icon }} style={{ height: 28, width: 28, borderRadius: 9 }} />
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
              <Text color="labelSecondary" size="13pt" weight="bold">
                {truncateToDecimals(String(position.currentValue), 2)}
              </Text>
              <Text color="labelSecondary" size="13pt" weight="bold">
                {truncateToDecimals(String(position.cashPnl), 2)}
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>
    </ButtonPressAnimation>
  );
});

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
