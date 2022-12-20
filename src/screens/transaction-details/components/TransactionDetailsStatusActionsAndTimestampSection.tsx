import React from 'react';
import { TransactionStatus } from '@/entities';
import { Box, Stack, Text } from '@/design-system';
import { formatTransactionDetailsDate } from '@/screens/transaction-details/helpers/formatTransactionDetailsDate';
import { capitalize } from 'lodash';
import { getIconColorAndGradientForTransactionStatus } from '@/screens/transaction-details/helpers/getIconColorAndGradientForTransactionStatus';
import RadialGradient from 'react-native-radial-gradient';
import { useTheme } from '@/theme';

type Props = {
  pending?: boolean;
  status?: TransactionStatus;
  minedAt?: number;
};

export const TransactionDetailsStatusActionsAndTimestampSection: React.FC<Props> = ({
  pending,
  status,
  minedAt,
}) => {
  const date = formatTransactionDetailsDate(minedAt);
  const { colors } = useTheme();
  const { icon, color, gradient } = getIconColorAndGradientForTransactionStatus(
    colors,
    status,
    pending
  );

  return (
    <Stack>
      <Box alignItems="flex-end">
        <Box
          style={{ overflow: 'hidden' }}
          height={{ custom: 40 }}
          width={{ custom: 40 }}
          borderRadius={20}
        >
          <RadialGradient
            style={{
              width: 40,
              height: 40,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            colors={colors.gradients.lightestGrey}
            center={[0, 20]}
            radius={40}
          >
            <Text size="20pt" weight="bold" color="labelTertiary">
              􀍠
            </Text>
          </RadialGradient>
        </Box>
      </Box>
      <Box paddingBottom="24px">
        <Stack alignHorizontal="center" space="16px">
          {status && (
            <Box borderRadius={30} style={{ overflow: 'hidden' }}>
              <RadialGradient
                style={{
                  width: 60,
                  height: 60,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                colors={gradient}
                center={[30, 30]}
                radius={30}
              >
                <Text size="30pt" weight="heavy" color={color}>
                  {icon}
                </Text>
              </RadialGradient>
            </Box>
          )}
          <Stack alignHorizontal="center" space="24px">
            {status && (
              <Text size="22pt" weight="heavy" color={color}>
                {capitalize(status)}
              </Text>
            )}
            {date && (
              <Text size="17pt" weight="bold" color="labelTertiary">
                {date}
              </Text>
            )}
          </Stack>
        </Stack>
      </Box>
    </Stack>
  );
};
