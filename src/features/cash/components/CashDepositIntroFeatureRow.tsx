import React, { memo, type ReactNode } from 'react';

import { Box, Text } from '@/design-system';

type CashDepositIntroFeatureRowProps = {
  icon: ReactNode;
  text: string;
};

/**
 * A non-tappable "feature bullet" row in the Cash Deposit intro panel: a fixed-width
 * leading icon slot followed by wrapping copy
 */
export const CashDepositIntroFeatureRow = memo(function CashDepositIntroFeatureRow({ icon, text }: CashDepositIntroFeatureRowProps) {
  return (
    <Box alignItems="center" flexDirection="row" gap={16}>
      <Box alignItems="center" justifyContent="center" width={{ custom: 40 }}>
        {icon}
      </Box>
      <Box flexShrink={1}>
        <Text color="label" size="17pt / 135%" weight="semibold">
          {text}
        </Text>
      </Box>
    </Box>
  );
});
