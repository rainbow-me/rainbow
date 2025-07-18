import React, { memo } from 'react';
import { Box, BoxProps, Text, TextIcon } from '@/design-system';
import * as i18n from '@/languages';

export const NoChartData = memo(function NoChartData({ height }: { height: BoxProps['height'] }) {
  return (
    <Box height={height} alignItems="center" justifyContent="center" flexDirection="row" gap={8} width="full">
      <TextIcon color="labelQuaternary" containerSize={12} size="icon 15px" weight="heavy">
        {'􀋪'}
      </TextIcon>
      <Text align="center" color="labelQuaternary" size="17pt" weight="heavy">
        {i18n.t(i18n.l.expanded_state.chart.no_chart_data)}
      </Text>
    </Box>
  );
});
