import React, { memo, useState } from 'react';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { Bleed, Box, Stack, Text, TextIcon, TextShadow } from '@/design-system';
import { DOWN_ARROW, UP_ARROW } from '@/features/perps/constants';
import { POLYMARKET_ACCENT_COLOR } from '@/features/polymarket/constants';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { StyleSheet } from 'react-native';
import * as i18n from '@/languages';
import { PolymarketPositionCard } from '@/features/polymarket/components/PolymarketPositionCard';
import { usePolymarketPositionsSummary } from '@/features/polymarket/stores/derived/usePolymarketPositionsSummary';
import { usePolymarketPositions } from '@/features/polymarket/stores/derived/usePolymarketPositions';
import { opacityWorklet } from '@/__swaps__/utils/swaps';

export const PolymarketPositionsSection = function PolymarketPositionsSection() {
  const { hasActivePositions } = usePolymarketPositionsSummary();

  return (
    <Stack space={'24px'}>
      <PositionsSummary />
      {!hasActivePositions && <NoActivePositions />}
      <ActivePositionsList />
      <LostPositionsList />
    </Stack>
  );
};

const NoActivePositions = memo(function NoActivePositions() {
  return (
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
  );
});

const PositionsSummary = memo(function PositionsSummary() {
  const { hasActivePositions, valueFormatted, textColor, isPositivePnl, unrealizedPnlPercent, unrealizedPnl } =
    usePolymarketPositionsSummary();

  return (
    <Box gap={16} paddingHorizontal="4px">
      <Box flexDirection="row" alignItems="center" justifyContent="space-between">
        <Text size="17pt" weight="heavy" color={hasActivePositions ? 'labelTertiary' : 'labelQuaternary'}>
          {i18n.t(i18n.l.perps.positions.open_positions)}
        </Text>
        {hasActivePositions && (
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
        <Text size="30pt" weight="heavy" color={hasActivePositions ? 'label' : 'labelQuaternary'}>
          {valueFormatted}
        </Text>
        {hasActivePositions && (
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
  );
});

const ActivePositionsList = memo(function ActivePositionsList() {
  const activePositions = usePolymarketPositions(state => state.activePositions);
  if (!activePositions.length) return null;

  return (
    <Box gap={12}>
      {activePositions.map(position => (
        <PolymarketPositionCard
          key={position.asset}
          position={position}
          onPress={() => {
            Navigation.handleAction(Routes.POLYMARKET_EVENT_SCREEN, { eventId: position.eventId, event: position.market.events[0] });
          }}
        />
      ))}
    </Box>
  );
});

const LostPositionsList = memo(function LostPositionsList() {
  const [showLostPositions, setShowLostPositions] = useState(false);
  const positions = usePolymarketPositions(state => state.lostPositions);
  if (!positions.length) return null;

  return (
    <Box gap={32}>
      <ButtonPressAnimation onPress={() => setShowLostPositions(prev => !prev)}>
        <Bleed top="10px">
          <Box flexDirection="row" alignItems="center" justifyContent="center" gap={8}>
            <Box
              height={20}
              width={20}
              justifyContent="center"
              alignItems="center"
              backgroundColor={opacityWorklet('#F5F8FF', 0.09)}
              borderRadius={10}
              style={{ transform: [{ rotate: showLostPositions ? '180deg' : '0deg' }] }}
            >
              <TextIcon size="icon 10px" weight="black" color="label">
                {'􀆈'}
              </TextIcon>
            </Box>
            <Text size="17pt" weight="bold" color="label">
              {showLostPositions ? i18n.t(i18n.l.predictions.account.hide_lost_bets) : i18n.t(i18n.l.predictions.account.show_lost_bets)}
            </Text>
          </Box>
        </Bleed>
      </ButtonPressAnimation>
      {showLostPositions && (
        <>
          <Text size="15pt" weight="semibold" color="labelTertiary" align="center">
            {i18n.t(i18n.l.predictions.account.lost_bets_dont_clear)}
          </Text>
          <Box gap={12}>
            {positions.map(position => (
              <PolymarketPositionCard
                key={position.asset}
                position={position}
                onPress={() => {
                  Navigation.handleAction(Routes.POLYMARKET_EVENT_SCREEN, { eventId: position.eventId, event: position.market.events[0] });
                }}
              />
            ))}
          </Box>
        </>
      )}
    </Box>
  );
});
