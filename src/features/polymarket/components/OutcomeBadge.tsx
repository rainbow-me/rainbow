import { memo, useMemo } from 'react';
import { Box, Text, useColorMode, useForegroundColor, globalColors, TextShadow } from '@/design-system';
import { opacity } from '@/data/opacity';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';

const RedGreenOutcomes = {
  yes: true,
  no: false,
  over: true,
  under: false,
};

export const OutcomeBadge = memo(function OutcomeBadge({
  outcome,
  outcomeIndex,
  color,
}: {
  outcome: string;
  outcomeIndex: number;
  color?: string;
}) {
  const { isDarkMode } = useColorMode();
  const foregroundGreen = useForegroundColor('green');
  const green = isDarkMode ? foregroundGreen : globalColors.green60;
  const red = isDarkMode ? '#FF655A' : '#FF584D';

  const colors = useMemo(() => {
    let primaryColor = outcomeIndex === 0 ? green : red;
    if (!(outcome.toLowerCase() in RedGreenOutcomes) && color) {
      primaryColor = color;
    }
    const backgroundColor = opacity(primaryColor, 0.12);
    const borderColor = opacity(primaryColor, 0.08);
    return { textColor: primaryColor, backgroundColor, borderColor };
  }, [outcome, outcomeIndex, green, red, color]);

  return (
    <Box
      backgroundColor={colors.backgroundColor}
      borderWidth={THICK_BORDER_WIDTH}
      height={18}
      justifyContent="center"
      alignItems="center"
      borderColor={{ custom: colors.borderColor }}
      borderRadius={11}
      paddingHorizontal={'6px'}
    >
      <TextShadow blur={12} shadowOpacity={0.24} color={colors.textColor}>
        <Text align="center" color={{ custom: colors.textColor }} size="11pt" weight="heavy">
          {outcome.toUpperCase()}
        </Text>
      </TextShadow>
    </Box>
  );
});
