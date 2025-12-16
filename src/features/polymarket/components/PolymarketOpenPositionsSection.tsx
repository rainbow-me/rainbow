import React from 'react';
import { ButtonPressAnimation } from '@/components/animations';
import { Box, Stack, Text, TextShadow } from '@/design-system';
import { DOWN_ARROW, UP_ARROW } from '@/features/perps/constants';
import { POLYMARKET_ACCENT_COLOR } from '@/features/polymarket/constants';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { StyleSheet } from 'react-native';
import * as i18n from '@/languages';
import { PolymarketPositionCard } from '@/features/polymarket/components/PolymarketPositionCard';
import { usePolymarketPositionsInfo } from '@/features/polymarket/stores/derived/usePolymarketPositionsInfo';
import { ButtonPressAnimationTouchEvent } from '@/components/animations/ButtonPressAnimation/types';

export const PolymarketOpenPositionsSection = function PolymarketOpenPositionsSection() {
  const positionsInfo = usePolymarketPositionsInfo();

  return (
    <Stack space={'24px'}>
      <Box gap={16} paddingHorizontal="4px">
        <Box flexDirection="row" alignItems="center" justifyContent="space-between">
          <Text size="17pt" weight="heavy" color={positionsInfo.hasPositions ? 'labelTertiary' : 'labelQuaternary'}>
            {i18n.t(i18n.l.perps.positions.open_positions)}
          </Text>
          {positionsInfo.hasPositions && (
            <Box flexDirection="row" alignItems="center" gap={2}>
              <TextShadow blur={16} shadowOpacity={0.2}>
                <Text size="12pt" weight="heavy" color={positionsInfo.textColor}>
                  {positionsInfo.isPositivePnl ? UP_ARROW : DOWN_ARROW}
                </Text>
              </TextShadow>
              <TextShadow blur={16} shadowOpacity={0.2}>
                <Text size="17pt" weight="heavy" color={positionsInfo.textColor}>
                  {positionsInfo.unrealizedPnlPercent}
                </Text>
              </TextShadow>
            </Box>
          )}
        </Box>
        <Box flexDirection="row" alignItems="center" justifyContent="space-between">
          <Text size="30pt" weight="heavy" color={positionsInfo.hasPositions ? 'label' : 'labelQuaternary'}>
            {positionsInfo.equity}
          </Text>
          {positionsInfo.hasPositions && (
            <Box flexDirection="row" alignItems="center" gap={2}>
              <TextShadow blur={16} shadowOpacity={0.2}>
                <Text size="20pt" weight="heavy" color={positionsInfo.textColor}>
                  {positionsInfo.isPositivePnl ? '+' : '-'}
                </Text>
              </TextShadow>
              <TextShadow blur={16} shadowOpacity={0.2}>
                <Text size="22pt" weight="heavy" color={positionsInfo.textColor}>
                  {positionsInfo.unrealizedPnl}
                </Text>
              </TextShadow>
            </Box>
          )}
        </Box>
      </Box>
      <Box gap={12}>
        {!positionsInfo.hasPositions && (
          <Box height={124} justifyContent="center" alignItems="center" gap={20} paddingBottom="24px">
            <TextShadow blur={22} shadowOpacity={0.9}>
              <Text size="34pt" weight="heavy" color={{ custom: POLYMARKET_ACCENT_COLOR }}>
                {'􀫸'}
              </Text>
            </TextShadow>
            <Text align="center" size="20pt" weight="heavy" color="labelSecondary">
              {'No open positions'}
            </Text>
            {/* TODO: Enable once learn more sheet is done */}
            <ButtonPressAnimation
              onPress={() => {
                Navigation.handleAction(Routes.POLYMARKET_EXPLAIN_SHEET);
              }}
            >
              <Box flexDirection="row" alignItems="center" gap={4}>
                <Text align="center" size="15pt" weight="bold" color={'labelTertiary'}>
                  {'Learn more about Predictions'}
                </Text>
                <Text align="center" size="icon 11px" weight="heavy" color={'labelQuaternary'} style={{ top: StyleSheet.hairlineWidth }}>
                  {'􀆊'}
                </Text>
              </Box>
            </ButtonPressAnimation>
          </Box>
        )}
        {positionsInfo.positions.map(position => (
          <ButtonPressAnimation
            key={position.asset}
            onPress={(e: ButtonPressAnimationTouchEvent) => {
              if (e && 'stopPropagation' in e) {
                e.stopPropagation();
              }
              Navigation.handleAction(Routes.POLYMARKET_EVENT_SCREEN, { eventId: position.eventId, event: position.market.events[0] });
            }}
            scaleTo={0.975}
          >
            <PolymarketPositionCard position={position} />
          </ButtonPressAnimation>
        ))}
      </Box>
    </Stack>
  );
};
