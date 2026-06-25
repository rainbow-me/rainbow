import { memo, useEffect } from 'react';

import { useWatcher } from '@/framework/ui/hooks/useWatcher';

import { ORDER_POLL_INTERVAL_MS } from '../constants';
import { isTerminalOrderStatus } from '../services/rampClient';
import { cashBuyOrderActions, useCashBuyOrderStore } from '../stores/cashBuyOrderStore';

/**
 * App-level owner of buy-order tracking. Mounted in SwipeNavigator so it runs regardless of which
 * screen is open (and on launch after a crash/OS kill): it recovers a submit interrupted before an
 * order id came back, then polls the active order to a terminal status. Completion surfaces through
 * the global toast (`applyTerminalOrder` -> `handleTransaction`), so the user sees the result without
 * reopening the add-cash sheet.
 */
export const CashBuyOrderWatcher = memo(function CashBuyOrderWatcher() {
  const order = useCashBuyOrderStore(state => state.order);

  // On launch, replay a submit interrupted before an order id came back.
  useEffect(() => {
    cashBuyOrderActions.resumePendingSubmission();
  }, []);

  useWatcher({
    enabled: order !== null && !isTerminalOrderStatus(order.status),
    interval: ORDER_POLL_INTERVAL_MS,
    watchFunction: cashBuyOrderActions.syncActiveOrder,
  });

  return null;
});
