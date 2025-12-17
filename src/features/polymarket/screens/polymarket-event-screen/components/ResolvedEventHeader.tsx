import { memo } from 'react';
import { Box, Separator, Text, TextIcon } from '@/design-system';
import * as i18n from '@/languages';
import { formatTimestamp, toUnixTime } from '@/worklets/dates';

export const ResolvedEventHeader = memo(function ResolvedEventHeader({ resolvedAt }: { resolvedAt: string | undefined }) {
  return (
    <Box gap={20}>
      <Box gap={12}>
        <Box flexDirection="row" alignItems="center" justifyContent="center" gap={4}>
          <TextIcon color="label" size="icon 15px" weight="heavy" align="center">
            {'􀁢'}
          </TextIcon>
          <Text color="label" size="15pt" weight="heavy" align="center">
            {i18n.t(i18n.l.predictions.event.market_resolved)}
          </Text>
        </Box>
        {resolvedAt && (
          <Text color="labelQuaternary" size="13pt" weight="bold" align="center">
            {formatTimestamp(toUnixTime(resolvedAt))}
          </Text>
        )}
      </Box>
      <Separator color="separatorSecondary" direction="horizontal" thickness={1} />
    </Box>
  );
});
