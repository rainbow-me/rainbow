import React, { useCallback, useMemo } from 'react';
import { TransactionStatus } from '@/entities';
import { Box, Stack, Text } from '@/design-system';
import { formatTransactionDetailsDate } from '@/screens/transaction-details/helpers/formatTransactionDetailsDate';
import { capitalize } from 'lodash';
import { getIconColorAndGradientForTransactionStatus } from '@/screens/transaction-details/helpers/getIconColorAndGradientForTransactionStatus';
import RadialGradient from 'react-native-radial-gradient';
import { useTheme } from '@/theme';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { StyleSheet } from 'react-native';
import { ButtonPressAnimation } from '@/components/animations';

const SIZE = 40;

type Props = {
  pending?: boolean;
  status?: TransactionStatus;
  minedAt?: number;
  onSpeedUp?: () => void;
  onCancel?: () => void;
};

export const TransactionDetailsStatusActionsAndTimestampSection: React.FC<Props> = ({
  pending,
  status,
  minedAt,
  onSpeedUp,
  onCancel,
}) => {
  const date = formatTransactionDetailsDate(minedAt);
  const { colors } = useTheme();
  const { icon, color, gradient } = getIconColorAndGradientForTransactionStatus(
    colors,
    status,
    pending
  );

  const menuConfig = useMemo(
    () => ({
      menuTitle: '',
      menuItems: [
        ...(onSpeedUp
          ? [
              {
                actionKey: 'speedUp',
                actionTitle: 'Speed Up',
                icon: {
                  iconType: 'SYSTEM',
                  iconValue: 'speedometer',
                },
              },
            ]
          : []),
        ...(onCancel
          ? [
              {
                actionKey: 'cancel',
                actionTitle: 'Cancel',
                menuAttributes: ['destructive'],
                icon: {
                  iconType: 'SYSTEM',
                  iconValue: 'xmark.circle',
                },
              },
            ]
          : []),
      ],
    }),
    [onSpeedUp, onCancel]
  );

  const onMenuItemPress = useCallback(e => {
    const { actionKey } = e.nativeEvent;
    switch (actionKey) {
      case 'speedUp':
        onSpeedUp?.();
        return;
      case 'cancel':
        onCancel?.();
        return;
    }
  }, []);

  return (
    <Stack>
      <Box alignItems="flex-end" height="40px">
        {(onSpeedUp || onCancel) && (
          <ContextMenuButton
            menuConfig={menuConfig}
            onPressMenuItem={onMenuItemPress}
          >
            <ButtonPressAnimation>
              <Box
                style={styles.overflowHidden}
                height={{ custom: SIZE }}
                width={{ custom: SIZE }}
                borderRadius={SIZE / 2}
              >
                <RadialGradient
                  style={styles.gradient}
                  colors={colors.gradients.lightestGrey}
                  center={[0, SIZE / 2]}
                  radius={SIZE}
                >
                  <Text size="20pt" weight="bold" color="labelTertiary">
                    􀍠
                  </Text>
                </RadialGradient>
              </Box>
            </ButtonPressAnimation>
          </ContextMenuButton>
        )}
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

const styles = StyleSheet.create({
  gradient: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overflowHidden: { overflow: 'hidden' },
});
