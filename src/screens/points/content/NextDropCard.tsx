import React, { memo, useReducer, useEffect } from 'react';
import { Box, Text, TextShadow, Stack, IconContainer, useForegroundColor, globalColors, useColorMode } from '@/design-system';
import { isToday, intervalToDuration, format } from 'date-fns';
import * as i18n from '@/languages';
import { LIGHT_SEPARATOR_COLOR, THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity } from '@/__swaps__/utils/swaps';
import { Card } from './PointsContent';

export const NextDropCard = memo(function NextDropCard({ nextDistribution }: { nextDistribution: Date }) {
  const { isDarkMode } = useColorMode();
  const separatorSecondary = useForegroundColor('separatorSecondary');
  const nextDistributionWithDay = isToday(nextDistribution)
    ? `${i18n.t(i18n.l.points.points.today)} ${format(nextDistribution, 'p')}`
    : format(nextDistribution, 'cccc p');

  return (
    <Card>
      <Box alignItems="center" flexDirection="row" justifyContent="space-between" paddingLeft="8px" width="full">
        <Box alignItems="center" flexDirection="row">
          <IconContainer size={24}>
            <TextShadow>
              <Text color="accent" size="icon 17px" weight="heavy">
                􀐫
              </Text>
            </TextShadow>
          </IconContainer>
          <Box gap={10} paddingLeft="10px">
            <Stack space="10px">
              <TextShadow shadowOpacity={0.2}>
                <Text color="label" size="17pt" weight="heavy">
                  {i18n.t(i18n.l.points.points.next_drop)}
                </Text>
              </TextShadow>
              <Text color="labelTertiary" size="13pt" weight="bold">
                {nextDistributionWithDay}
              </Text>
            </Stack>
          </Box>
        </Box>
        <Box
          alignItems="center"
          background="fillQuaternary"
          borderRadius={18}
          height={{ custom: 36 }}
          justifyContent="center"
          margin={{ custom: 2 }}
          paddingHorizontal="12px"
          style={{
            backgroundColor: isDarkMode ? opacity(LIGHT_SEPARATOR_COLOR, 0.05) : globalColors.white100,
            borderColor: separatorSecondary,
            borderCurve: 'continuous',
            borderWidth: THICK_BORDER_WIDTH,
            overflow: 'hidden',
          }}
        >
          <NextDistributionCountdown nextDistribution={nextDistribution} />
        </Box>
      </Box>
    </Card>
  );
});

const NextDistributionCountdown = ({ nextDistribution }: { nextDistribution: Date }) => {
  const [nextDistributionIn, recalcNextDistributionDistance] = useReducer(
    () =>
      intervalToDuration({
        start: Date.now(),
        end: nextDistribution,
      }),
    intervalToDuration({
      start: Date.now(),
      end: nextDistribution,
    })
  );

  useEffect(() => {
    const interval = setInterval(recalcNextDistributionDistance, 1000);
    return () => clearInterval(interval);
  }, [nextDistribution]);

  const { days, hours, minutes } = nextDistributionIn;
  const dayStr = days ? `${days}d` : '';
  const hourStr = hours ? `${hours}h` : '';
  const minuteStr = minutes ? `${minutes}m` : '';

  return (
    <TextShadow shadowOpacity={0.24}>
      <Text align="center" color="labelSecondary" size="17pt" weight="heavy">
        {`${dayStr} ${hourStr} ${minuteStr}`.trim()}
      </Text>
    </TextShadow>
  );
};
