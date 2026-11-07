import { Alert } from 'react-native';

import { POLYMARKET_CLOB_API_ERRORS, PolymarketBuyPositionError } from '@/features/polymarket/errors';
import * as i18n from '@/languages';

/**
 * Selects and presents the message for a failed or unconfirmed order.
 */
export function presentPolymarketOrderAlert(outcome: Error | 'unconfirmed', side: 'buy' | 'sell'): void {
  const errors = i18n.l.predictions.errors;
  let copy: { title: string; message: string };

  if (outcome === 'unconfirmed') {
    copy = errors.order.unconfirmed;
  } else if (
    outcome.message === POLYMARKET_CLOB_API_ERRORS.FOK_ORDER_NOT_FILLED ||
    outcome.message === POLYMARKET_CLOB_API_ERRORS.NO_MATCH
  ) {
    copy = errors.order.unfilled;
  } else if (outcome instanceof PolymarketBuyPositionError) {
    const buyErrors = i18n.l.predictions.new_position.errors;
    copy = {
      title: buyErrors[`${outcome.reason}_title`],
      message: buyErrors[`${outcome.reason}_message`],
    };
  } else {
    copy = {
      title: errors.title,
      message: side === 'buy' ? errors.failed_to_place_bet : errors.failed_to_cash_out,
    };
  }

  Alert.alert(i18n.t(copy.title), i18n.t(copy.message));
}
