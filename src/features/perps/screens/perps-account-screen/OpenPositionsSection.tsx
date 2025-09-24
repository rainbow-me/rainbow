import React from 'react';
import { ButtonPressAnimation } from '@/components/animations';
import { Box, Stack, Text, TextShadow, useColorMode } from '@/design-system';
import { PerpPositionCard } from '@/features/perps/components/PerpPositionCard';
import { DOWN_ARROW, UP_ARROW } from '@/features/perps/constants';
import { usePerpsPositionsInfo } from '@/features/perps/stores/derived/usePerpsPositionsInfo';
import { navigateToPerpDetailScreen } from '@/features/perps/utils';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { Image } from 'react-native';
import infinityIcon from '@/assets/infinity.png';
import * as i18n from '@/languages';

export const OpenPositionsSection = function OpenPositionsSection() {
  const { isDarkMode } = useColorMode();
  const positionsInfo = usePerpsPositionsInfo();

  return (
    <Box>
      <Stack space={'24px'}>
        <Box gap={16} paddingHorizontal="4px">
          <Box flexDirection="row" alignItems="center" justifyContent="space-between">
            <Text size="17pt" weight="heavy" color="labelTertiary">
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
        <Box gap={20}>
          {!positionsInfo.hasPositions && (
            <Box height={100} justifyContent="center" alignItems="center" gap={20}>
              <Image source={infinityIcon} style={{ width: 52, height: 24 }} resizeMode="contain" />
              <Text size="20pt" weight="heavy" color={isDarkMode ? 'label' : 'labelSecondary'}>
                {i18n.t(i18n.l.perps.positions.no_open_positions)}
              </Text>
            </Box>
          )}
          {positionsInfo.positions.map(position => (
            <ButtonPressAnimation
              key={position.symbol}
              onPress={() => {
                navigateToPerpDetailScreen(position.symbol);
              }}
              onLongPress={() => {
                Navigation.handleAction(Routes.CLOSE_POSITION_BOTTOM_SHEET, {
                  symbol: position.symbol,
                });
              }}
              scaleTo={0.975}
            >
              <PerpPositionCard position={position} />
            </ButtonPressAnimation>
          ))}
        </Box>
      </Stack>
    </Box>
  );
};
