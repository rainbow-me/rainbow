import React, { memo, useMemo } from 'react';
import { Bleed, Box, Text, TextShadow, useForegroundColor } from '@/design-system';
import { PerpPositionSide } from '@/features/perps/types';
import { opacityWorklet } from '@/__swaps__/utils/swaps';

type PositionSideBadgeProps = {
  side: PerpPositionSide;
};

export const PositionSideBadge = memo(function PositionSideBadge({ side }: PositionSideBadgeProps) {
  const green = useForegroundColor('green');
  const red = useForegroundColor('red');

  const textColor = useMemo(() => {
    return side === PerpPositionSide.LONG ? green : red;
  }, [side, green, red]);

  const backgroundColor = useMemo(() => {
    return opacityWorklet(textColor, 0.08);
  }, [textColor]);

  return (
    <Bleed vertical="6px">
      <Box
        height={18}
        backgroundColor={backgroundColor}
        paddingHorizontal={'6px'}
        borderRadius={11}
        justifyContent="center"
        alignItems="center"
        borderWidth={1}
        borderColor={{ custom: backgroundColor }}
      >
        <TextShadow color={textColor} shadowOpacity={0.24} blur={6}>
          <Text align="right" size="11pt" weight="heavy" color={{ custom: textColor }}>
            {side}
          </Text>
        </TextShadow>
      </Box>
    </Bleed>
  );
});
