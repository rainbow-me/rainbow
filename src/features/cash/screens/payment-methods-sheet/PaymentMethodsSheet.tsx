import React, { memo, useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { createStoreActions } from '@storesjs/stores';

import { AbsolutePortalRoot } from '@/components/AbsolutePortal';
import { DropdownMenu, type MenuItem } from '@/components/DropdownMenu';
import { PanelSheet } from '@/components/PanelSheet/PanelSheet';
import { Box, Text, useForegroundColor } from '@/design-system';
import { CashStatusHalfSheet } from '@/features/cash/components/CashStatusHalfSheet';
import { VisaBadge } from '@/features/cash/components/VisaBadge';
import { useCardRemovalFlowStore } from '@/features/cash/stores/cardRemovalFlowStore';
import { useCashLinkedCard, type LinkedCard } from '@/features/cash/stores/cashPaymentMethodStore';
import { WrappedAlert as Alert } from '@/helpers/alert';
import * as i18n from '@/languages';
import { useNavigation } from '@/navigation/Navigation';

const l = i18n.l.cash.payment_methods;
const cardRemovalFlowActions = createStoreActions(useCardRemovalFlowStore);

type CardAction = 'remove';

function CardRow({ card, onRemove }: { card: LinkedCard; onRemove: (card: LinkedCard) => void }) {
  const handlePressMenuItem = useCallback(() => onRemove(card), [card, onRemove]);
  const menuConfig = {
    menuItems: [
      {
        actionKey: 'remove',
        actionTitle: i18n.t(l.remove_card),
        destructive: true,
        icon: { iconType: 'SYSTEM', iconValue: 'trash' },
      },
    ] satisfies MenuItem<CardAction>[],
  };

  return (
    <Box alignItems="center" flexDirection="row" justifyContent="space-between" paddingHorizontal="10px">
      <Box alignItems="center" flexDirection="row" gap={16}>
        <VisaBadge size="large" />
        <Box gap={10}>
          <Text color="label" size="17pt" weight="bold">
            {card.brand}
          </Text>
          <Text color="labelQuaternary" size="13pt" weight="bold">
            {`*${card.last4}`}
          </Text>
        </Box>
      </Box>
      <DropdownMenu<CardAction>
        menuConfig={menuConfig}
        onPressMenuItem={handlePressMenuItem}
        testID={`cash-payment-methods-card-menu-${card.id}`}
      >
        <Text color="blue" size="17pt" weight="heavy">
          {'􀍠'}
        </Text>
      </DropdownMenu>
    </Box>
  );
}

export const PaymentMethodsSheet = memo(function PaymentMethodsSheet() {
  const linkedCard = useCashLinkedCard();
  const isRemoving = useCardRemovalFlowStore(state => state.state === 'removing');
  const separatorTertiary = useForegroundColor('separatorTertiary');
  const navigation = useNavigation();
  const [cardPendingRemoval, setCardPendingRemoval] = useState<LinkedCard | null>(null);

  const handleConfirmRemoval = useCallback(async (card: LinkedCard) => {
    const result = await cardRemovalFlowActions.remove(card);
    if (result === 'removed') {
      setCardPendingRemoval(null);
      return;
    }
    if (result !== 'failed') return;
    setCardPendingRemoval(null);
    Alert.alert(i18n.t(l.remove_error_title), i18n.t(l.remove_error_description));
  }, []);

  useEffect(
    () =>
      navigation.addListener('beforeRemove', event => {
        if (useCardRemovalFlowStore.getState().state === 'removing') event.preventDefault();
      }),
    [navigation]
  );

  useEffect(() => {
    if (linkedCard || !navigation.isFocused()) return;
    navigation.goBack();
  }, [linkedCard, navigation]);

  return (
    <>
      <PanelSheet showHandle={false}>
        <Box paddingBottom="24px" paddingTop="28px" style={styles.content} testID="cash-payment-methods-sheet">
          <Text align="center" color="label" size="20pt" weight="heavy">
            {i18n.t(l.title)}
          </Text>
          <Box style={[styles.separator, { backgroundColor: separatorTertiary }]} />
          {linkedCard && <CardRow card={linkedCard} onRemove={setCardPendingRemoval} />}
        </Box>
      </PanelSheet>
      {cardPendingRemoval && (
        <CashStatusHalfSheet
          description={i18n.t(l.remove_description, { card: cardPendingRemoval.brand })}
          primaryAction={{
            disabled: isRemoving,
            label: i18n.t(l.keep_card),
            onPress: () => setCardPendingRemoval(null),
            testID: 'cash-remove-card-keep',
          }}
          secondaryAction={{
            label: i18n.t(l.remove_card),
            loading: isRemoving,
            onPress: () => {
              void handleConfirmRemoval(cardPendingRemoval);
            },
            testID: 'cash-remove-card-confirm',
          }}
          status="warning"
          testID="cash-remove-card-sheet"
          title={i18n.t(l.remove_title)}
        />
      )}
      <AbsolutePortalRoot style={styles.portal} />
    </>
  );
});

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 14,
  },
  portal: {
    zIndex: 30001,
  },
  separator: {
    borderRadius: 1,
    height: 1,
    marginBottom: 18,
    marginTop: 24,
  },
});
