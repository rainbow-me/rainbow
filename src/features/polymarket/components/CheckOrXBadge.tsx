import { opacity } from '@/framework/ui/utils/opacity';
import { Box, Text, useColorMode, useForegroundColor } from '@/design-system';
import { TextSize } from '@/design-system/typography/typeHierarchy';
import { InnerShadow } from '@/features/polymarket/components/InnerShadow';
import { PolymarketPosition } from '@/features/polymarket/types';
import { memo, useMemo } from 'react';

export const CheckOrXBadge = memo(function CheckOrXBadge({
  borderWidth,
  fontSize = 'icon 8px',
  size = 16,
  position,
}: {
  borderWidth?: number;
  fontSize?: TextSize;
  size: number;
  position: PolymarketPosition;
}) {
  const { isDarkMode } = useColorMode();
  const green = useForegroundColor('green');
  const red = useForegroundColor('red');
  const defaultBorderWidth = isDarkMode ? 1 : 2 / 3;
  const resolvedBorderWidth = borderWidth || defaultBorderWidth;

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
      width={size}
      height={size}
      borderRadius={size / 2}
      justifyContent="center"
      alignItems="center"
      borderWidth={resolvedBorderWidth}
      borderColor={{ custom: 'rgba(255, 255, 255, 0.12)' }}
    >
      <InnerShadow borderRadius={size / 2} color={opacity('#FFFFFF', 0.28)} width={size} height={size} blur={2.5} dx={0} dy={1} />
      <Text color="white" size={fontSize} weight="heavy">
        {isWin ? '􀆅' : '􀆄'}
      </Text>
    </Box>
  );
});
