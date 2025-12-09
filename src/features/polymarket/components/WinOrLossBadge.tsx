import { Box, Text, useColorMode, useForegroundColor } from '@/design-system';
import { TextSize } from '@/design-system/typography/typeHierarchy';
import { PolymarketPosition } from '@/features/polymarket/types';
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
      borderColor={{ custom: 'rgba(255, 255, 255, 0.12)' }}
    >
      <Text color="label" size={fontSize} weight="heavy">
        {isWin ? 'WON' : 'LOST'}
      </Text>
    </Box>
  );
});
