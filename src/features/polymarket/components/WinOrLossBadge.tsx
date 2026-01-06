import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { Box, Text, useColorMode, useForegroundColor } from '@/design-system';
import { TextSize } from '@/design-system/typography/typeHierarchy';
import { InnerShadow } from '@/features/polymarket/components/InnerShadow';
import { PolymarketPosition } from '@/features/polymarket/types';
import * as i18n from '@/languages';
import { memo, useMemo } from 'react';

export const WinOrLossBadge = memo(function WinOrLossBadge({
  borderWidth = 2,
  fontSize = '15pt',
  height = 26,
  paddingHorizontal = 8,
  position,
}: {
  borderWidth?: number;
  fontSize?: TextSize;
  height: number;
  paddingHorizontal?: number;
  position: PolymarketPosition;
}) {
  const { isDarkMode } = useColorMode();
  const green = useForegroundColor('green');
  const red = useForegroundColor('red');

  const isWin = useMemo(() => {
    return position.redeemable && position.size === position.currentValue;
  }, [position.redeemable, position.size, position.currentValue]);

  const backgroundColor = useMemo(() => {
    const wonGreen = isDarkMode ? '#1F9E39' : green;
    const lostRed = isDarkMode ? '#D53F35' : red;
    return isWin ? wonGreen : lostRed;
  }, [isWin, green, red, isDarkMode]);

  return (
    <Box
      backgroundColor={backgroundColor}
      height={height}
      borderRadius={13}
      justifyContent="center"
      alignItems="center"
      borderWidth={borderWidth}
      paddingHorizontal={{ custom: paddingHorizontal }}
      borderColor={{ custom: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)' }}
    >
      <InnerShadow borderRadius={13} color={opacityWorklet('#FFFFFF', 0.28)} height={height} blur={2.5} dx={0} dy={1} />
      <Text color="white" size={fontSize} weight="heavy">
        {isWin ? i18n.t(i18n.l.predictions.position.won_badge) : i18n.t(i18n.l.predictions.position.lost_badge)}
      </Text>
    </Box>
  );
});
