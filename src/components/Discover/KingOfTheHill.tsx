import React, { useCallback } from 'react';
import * as i18n from '@/languages';
import { Box, globalColors, Inline, Text, useBackgroundColor, useColorMode } from '@/design-system';
import { LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR } from '@/__swaps__/screens/Swap/constants';
import FastImage from 'react-native-fast-image';
import { getSizedImageUrl } from '@/handlers/imgix';
import { ButtonPressAnimation } from '@/components/animations';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import { KingOfTheHillToken, useKingOfTheHillStore } from '@/state/kingOfTheHill/kingOfTheHillStore';
import { KingOfTheHillCard } from '@/components/cards/skia-cards/KingOfTheHillCard';
import { Skeleton } from '@/screens/points/components/Skeleton';

const LastWinnerSection = React.memo(function LastWinnerSection({ lastWinnerToken }: { lastWinnerToken: KingOfTheHillToken }) {
  console.log('LAST WINNER SECTION');
  const { navigate } = useNavigation();
  const { isDarkMode } = useColorMode();
  const fillTertiaryColor = useBackgroundColor('fillTertiary');
  const sizedIconUrl = getSizedImageUrl(lastWinnerToken.iconUrl, 16);

  const navigateToLastWinner = useCallback(() => {
    navigate(Routes.EXPANDED_ASSET_SHEET_V2, {
      asset: lastWinnerToken,
      address: lastWinnerToken.address,
      chainId: lastWinnerToken.chainID,
    });
  }, [lastWinnerToken, navigate]);

  return (
    <Box flexDirection="row" justifyContent="space-between" paddingHorizontal={'10px'}>
      <ButtonPressAnimation onPress={navigateToLastWinner}>
        <GradientBorderView
          borderGradientColors={[fillTertiaryColor, 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          borderRadius={13}
          backgroundColor={isDarkMode ? globalColors.grey100 : '#FBFCFD'}
          style={{ height: 26 }}
        >
          <Box height="full" justifyContent="center" paddingLeft={'10px'} paddingRight={{ custom: 5 }}>
            <Inline alignVertical="center" space={'6px'}>
              <Text color="labelQuaternary" size="11pt" weight="bold">
                {i18n.t(i18n.l.king_of_hill.last_winner)}
              </Text>
              <Box height={16} width={1} backgroundColor={isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR} />
              <Text color="labelTertiary" size="11pt" weight="heavy">
                {lastWinnerToken.symbol}
              </Text>
              <FastImage source={{ uri: sizedIconUrl }} style={{ width: 16, height: 16, borderRadius: 8 }} />
            </Inline>
          </Box>
        </GradientBorderView>
      </ButtonPressAnimation>
      <ButtonPressAnimation
        onPress={() => {
          // TODO: need a how it works sheet
        }}
      >
        <GradientBorderView
          borderGradientColors={[fillTertiaryColor, 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          borderRadius={13}
          backgroundColor={isDarkMode ? globalColors.grey100 : '#FBFCFD'}
          style={{ height: 26 }}
        >
          <Box height="full" justifyContent="center" paddingHorizontal={'10px'}>
            <Text color="labelQuaternary" size="13pt" weight="bold">
              {i18n.t(i18n.l.king_of_hill.how_it_works)}
            </Text>
          </Box>
        </GradientBorderView>
      </ButtonPressAnimation>
    </Box>
  );
});

export function KingOfTheHill() {
  const kingOfTheHill = useKingOfTheHillStore(store => store.getData());

  if (!kingOfTheHill) {
    return <Skeleton width={'100%'} height={84 + 26 + 6} />;
  }

  return (
    <Box gap={6}>
      <LastWinnerSection lastWinnerToken={kingOfTheHill.lastWinner.token} />
      <KingOfTheHillCard king={kingOfTheHill.currentKing} />
    </Box>
  );
}
