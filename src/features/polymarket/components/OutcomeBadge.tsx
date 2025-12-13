import { memo, useMemo } from 'react';
import { Box, Text, useColorMode, useForegroundColor } from '@/design-system';
import { opacityWorklet } from '@/__swaps__/utils/swaps';

export const OutcomeBadge = memo(function OutcomeBadge({ outcome, outcomeIndex }: { outcome: string; outcomeIndex: number }) {
  const { isDarkMode } = useColorMode();
  const green = useForegroundColor('green');
  const red = isDarkMode ? '#FF655A' : '#FF584D';

  const colors = useMemo(() => {
    const primaryColor = outcomeIndex === 0 ? green : red;
    const backgroundColor = opacityWorklet(primaryColor, 0.08);
    return { textColor: primaryColor, backgroundColor };
  }, [outcomeIndex, green, red]);

  return (
    <Box
      backgroundColor={colors.backgroundColor}
      borderWidth={1}
      height={18}
      justifyContent="center"
      alignItems="center"
      borderColor={{ custom: colors.backgroundColor }}
      borderRadius={10}
      paddingHorizontal={'6px'}
    >
      <Text align="center" color={{ custom: colors.textColor }} size="11pt" weight="heavy">
        {outcome.toUpperCase()}
      </Text>
    </Box>
  );
});
