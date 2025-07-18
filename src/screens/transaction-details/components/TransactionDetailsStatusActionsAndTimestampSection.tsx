import { ButtonPressAnimation } from '@/components/animations';
import ContextMenuButton, { MenuConfig } from '@/components/native-context-menu/contextMenu';
import { Box, Stack, Text } from '@/design-system';
import { PendingTransaction, RainbowTransaction, TransactionStatus } from '@/entities';
import * as i18n from '@/languages';
import { formatTransactionDetailsDate } from '@/screens/transaction-details/helpers/formatTransactionDetailsDate';
import { getIconColorAndGradientForTransactionStatus } from '@/screens/transaction-details/helpers/getIconColorAndGradientForTransactionStatus';
import { useTheme } from '@/theme';
import { haptics } from '@/utils';
import Routes from '@rainbow-me/routes';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import RadialGradient from 'react-native-radial-gradient';
import { useAccountAddress } from '@/state/wallets/walletsStore';

const SIZE = 40;

type Props = {
  transaction: RainbowTransaction;
  hideIcon?: boolean;
};

export const TransactionDetailsStatusActionsAndTimestampSection: React.FC<Props> = ({ transaction, hideIcon }) => {
  const { minedAt, status, type, from } = transaction;
  const { navigate } = useNavigation();
  const accountAddress = useAccountAddress();
  const date = formatTransactionDetailsDate(minedAt ?? undefined);
  const { colors } = useTheme();
  const { icon, color, gradient } = getIconColorAndGradientForTransactionStatus(colors, status);

  const isOutgoing = from?.toLowerCase() === accountAddress?.toLowerCase();
  const canBeResubmitted = isOutgoing && !minedAt;
  const canBeCancelled = canBeResubmitted && status !== TransactionStatus.cancelling;

  const menuConfig = useMemo(
    () =>
      ({
        menuTitle: '',
        menuItems: [
          ...(canBeResubmitted
            ? [
                {
                  actionKey: 'speedUp',
                  actionTitle: i18n.t(i18n.l.transaction_details.actions_menu.speed_up),
                  icon: {
                    iconType: 'SYSTEM',
                    iconValue: 'speedometer',
                  },
                },
              ]
            : []),
          ...(canBeCancelled
            ? [
                {
                  actionKey: 'cancel',
                  actionTitle: i18n.t(i18n.l.transaction_details.actions_menu.cancel),
                  menuAttributes: ['destructive' as const],
                  icon: {
                    iconType: 'SYSTEM',
                    iconValue: 'xmark.circle',
                  },
                },
              ]
            : []),
        ],
      }) satisfies MenuConfig,
    [canBeCancelled, canBeResubmitted]
  );

  const onMenuItemPress = useCallback(
    // @ts-expect-error ContextMenu is an untyped JS component and can't type its onPress handler properly
    e => {
      const { actionKey } = e.nativeEvent;
      haptics.selection();
      switch (actionKey) {
        case 'speedUp':
          navigate(Routes.SPEED_UP_AND_CANCEL_SHEET, {
            tx: transaction as PendingTransaction,
            type: 'speed_up',
          });
          return;
        case 'cancel':
          navigate(Routes.SPEED_UP_AND_CANCEL_SHEET, {
            tx: transaction as PendingTransaction,
            type: 'cancel',
          });
          return;
      }
    },
    [navigate, transaction]
  );

  return (
    <Stack>
      <Box alignItems="flex-end" height="40px">
        {(canBeResubmitted || canBeCancelled) && (
          <ContextMenuButton testID="transaction-details-context-menu-button" menuConfig={menuConfig} onPressMenuItem={onMenuItemPress}>
            <ButtonPressAnimation>
              <Box style={styles.overflowHidden} height={{ custom: SIZE }} width={{ custom: SIZE }} borderRadius={SIZE / 2}>
                <RadialGradient style={styles.gradient} colors={colors.gradients.lightestGrey} center={[0, SIZE / 2]} radius={SIZE}>
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
          {type && !hideIcon && (
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
            {type && (
              <Text size="22pt" weight="heavy" color={color}>
                {/* @ts-ignore */}
                {i18n.t(i18n.l.transactions.type[transaction?.title])}
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
