import { LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR } from '@/__swaps__/screens/Swap/constants';
import { ButtonPressAnimation } from '@/components/animations';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import { Box, globalColors, Inline, Text, useBackgroundColor, useColorMode } from '@/design-system';
import { KingOfTheHillToken } from '@/graphql/__generated__/metadata';
import { getSizedImageUrl } from '@/handlers/imgix';
import * as i18n from '@/languages';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import React, { useCallback } from 'react';
import FastImage from 'react-native-fast-image';

interface HeaderProps {
  lastWinner?: KingOfTheHillToken;
}

const SegmentedControl = React.memo(function SegmentedControl() {
  const { isDarkMode } = useColorMode();
  const fillTertiaryColor = useBackgroundColor('fillTertiary');

  return (
    <Box paddingHorizontal="20px">
      <GradientBorderView
        borderGradientColors={[fillTertiaryColor, 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        borderRadius={16}
        backgroundColor={isDarkMode ? globalColors.grey100 : '#FBFCFD'}
        style={{ height: 32 }}
      >
        <Box height="full" flexDirection="row" alignItems="center" paddingHorizontal="12px">
          <Box alignItems="center" style={{ flex: 1 }}>
            <Text color="labelTertiary" size="13pt" weight="bold">
              {i18n.t(i18n.l.king_of_hill.name)}
            </Text>
          </Box>
          <Box height={{ custom: 16 }} width={{ custom: 1 }} backgroundColor={isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR} />
          <Box alignItems="center" style={{ flex: 1 }}>
            <Text color="labelTertiary" size="13pt" weight="bold">
              {i18n.t(i18n.l.king_of_hill.vol)}
            </Text>
          </Box>
          <Box height={{ custom: 16 }} width={{ custom: 1 }} backgroundColor={isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR} />
          <Box alignItems="center" style={{ flex: 1 }}>
            <Text color="labelTertiary" size="13pt" weight="bold">
              {i18n.t(i18n.l.king_of_hill.mcap)}
            </Text>
          </Box>
        </Box>
      </GradientBorderView>
    </Box>
  );
});

const LastWinnerSection = React.memo(function LastWinnerSection({ lastWinner }: { lastWinner: KingOfTheHillToken }) {
  const { token } = lastWinner;
  const { isDarkMode } = useColorMode();
  const fillTertiaryColor = useBackgroundColor('fillTertiary');
  const sizedIconUrl = getSizedImageUrl(token.iconUrl, 16);

  const navigateToLastWinner = useCallback(() => {
    Navigation.handleAction(Routes.EXPANDED_ASSET_SHEET_V2, {
      asset: token,
      address: token.address,
      chainId: token.chainId,
    });
  }, [token]);

  const navigateToExplainSheet = useCallback(() => {
    Navigation.handleAction(Routes.KING_OF_THE_HILL_EXPLAIN_SHEET);
  }, []);

  return (
    <Box flexDirection="row" justifyContent="space-between" paddingHorizontal="10px">
      <ButtonPressAnimation onPress={navigateToLastWinner}>
        <GradientBorderView
          borderGradientColors={[fillTertiaryColor, 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          borderRadius={13}
          backgroundColor={isDarkMode ? globalColors.grey100 : '#FBFCFD'}
          style={{ height: 26 }}
        >
          <Box height="full" justifyContent="center" paddingLeft="10px" paddingRight="6px">
            <Inline alignVertical="center" space={'6px'} wrap={false}>
              <Text color="labelQuaternary" size="11pt" weight="bold">
                {i18n.t(i18n.l.king_of_hill.last_winner)}
              </Text>
              <Box height={{ custom: 16 }} width={{ custom: 1 }} backgroundColor={isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR} />
              <Text color="labelTertiary" size="11pt" weight="heavy">
                {token.symbol}
              </Text>
              <FastImage source={{ uri: sizedIconUrl }} style={{ width: 16, height: 16, borderRadius: 8 }} />
            </Inline>
          </Box>
        </GradientBorderView>
      </ButtonPressAnimation>
      <ButtonPressAnimation onPress={navigateToExplainSheet}>
        <GradientBorderView
          borderGradientColors={[fillTertiaryColor, 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          borderRadius={13}
          backgroundColor={isDarkMode ? globalColors.grey100 : '#FBFCFD'}
          style={{ height: 26 }}
        >
          <Box height="full" justifyContent="center" paddingHorizontal="10px">
            <Text color="labelQuaternary" size="13pt" weight="bold">
              {i18n.t(i18n.l.king_of_hill.how_it_works)}
            </Text>
          </Box>
        </GradientBorderView>
      </ButtonPressAnimation>
    </Box>
  );
});

export function Header({ lastWinner }: HeaderProps) {
  return (
    <Box gap={6}>
      <SegmentedControl />
      {lastWinner && <LastWinnerSection lastWinner={lastWinner} />}
    </Box>
  );
}
