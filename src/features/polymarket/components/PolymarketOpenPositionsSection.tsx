import React, { memo } from 'react';
import { ButtonPressAnimation } from '@/components/animations';
import { Box, Stack, Text, TextShadow } from '@/design-system';
import { DOWN_ARROW, UP_ARROW } from '@/features/perps/constants';
import { POLYMARKET_ACCENT_COLOR } from '@/features/polymarket/constants';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { StyleSheet } from 'react-native';
import * as i18n from '@/languages';
import { PolymarketPositionCard } from '@/features/polymarket/components/PolymarketPositionCard';
import { usePolymarketPositionsSummary } from '@/features/polymarket/stores/derived/usePolymarketPositionsSummary';
import { usePolymarketPositions } from '@/features/polymarket/stores/derived/usePolymarketPositions';

export const PolymarketOpenPositionsSection = function PolymarketOpenPositionsSection() {
  const { hasPositions, valueFormatted, textColor, isPositivePnl, unrealizedPnlPercent, unrealizedPnl } = usePolymarketPositionsSummary();

  return (
    <Stack space={'24px'}>
      <Box gap={16} paddingHorizontal="4px">
        <Box flexDirection="row" alignItems="center" justifyContent="space-between">
          <Text size="17pt" weight="heavy" color={hasPositions ? 'labelTertiary' : 'labelQuaternary'}>
            {i18n.t(i18n.l.perps.positions.open_positions)}
          </Text>
          {hasPositions && (
            <Box flexDirection="row" alignItems="center" gap={2}>
              <TextShadow blur={16} shadowOpacity={0.2}>
                <Text size="12pt" weight="heavy" color={textColor}>
                  {isPositivePnl ? UP_ARROW : DOWN_ARROW}
                </Text>
              </TextShadow>
              <TextShadow blur={16} shadowOpacity={0.2}>
                <Text size="17pt" weight="heavy" color={textColor}>
                  {unrealizedPnlPercent}
                </Text>
              </TextShadow>
            </Box>
          )}
        </Box>
        <Box flexDirection="row" alignItems="center" justifyContent="space-between">
          <Text size="30pt" weight="heavy" color={hasPositions ? 'label' : 'labelQuaternary'}>
            {valueFormatted}
          </Text>
          {hasPositions && (
            <Box flexDirection="row" alignItems="center" gap={2}>
              <TextShadow blur={16} shadowOpacity={0.2}>
                <Text size="20pt" weight="heavy" color={textColor}>
                  {isPositivePnl ? '+' : '-'}
                </Text>
              </TextShadow>
              <TextShadow blur={16} shadowOpacity={0.2}>
                <Text size="22pt" weight="heavy" color={textColor}>
                  {unrealizedPnl}
                </Text>
              </TextShadow>
            </Box>
          )}
        </Box>
      </Box>
      {!hasPositions && (
        <Box height={124} justifyContent="center" alignItems="center" gap={20} paddingBottom="24px">
          <TextShadow blur={22} shadowOpacity={0.9}>
            <Text size="34pt" weight="heavy" color={{ custom: POLYMARKET_ACCENT_COLOR }}>
              {'􀫸'}
            </Text>
          </TextShadow>
          <Text align="center" size="20pt" weight="heavy" color="labelSecondary">
            {i18n.t(i18n.l.predictions.position.no_open_positions)}
          </Text>
          <ButtonPressAnimation
            onPress={() => {
              Navigation.handleAction(Routes.POLYMARKET_EXPLAIN_SHEET);
            }}
          >
            <Box flexDirection="row" alignItems="center" gap={4}>
              <Text align="center" size="15pt" weight="bold" color={'labelTertiary'}>
                {i18n.t(i18n.l.predictions.position.learn_more)}
              </Text>
              <Text align="center" size="icon 11px" weight="heavy" color={'labelQuaternary'} style={{ top: StyleSheet.hairlineWidth }}>
                {'􀆊'}
              </Text>
            </Box>
          </ButtonPressAnimation>
        </Box>
      )}
      <PolymarketPositionsList />
    </Stack>
  );
};

const PolymarketPositionsList = memo(function PolymarketPositionsList() {
  const positions = usePolymarketPositions(state => state.positions);
  if (!positions.length) return null;

  return (
    <Box gap={12}>
      {positions.map(position => (
        <PolymarketPositionCard key={position.asset} position={position} />
      ))}
    </Box>
  );
});
