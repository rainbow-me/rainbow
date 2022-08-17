import { QuoteError } from '@rainbow-me/swaps';
import lang from 'i18n-js';

export interface ExchangeErrorCode extends QuoteError {
  buttonLabel: string;
  explainer: string;
}

export default function handleSwapErrorCodes(error: QuoteError) {
  const { error_code: errorCode } = error;
  switch (errorCode) {
    case 501:
      return {
        buttonLabel: lang.t('button.confirm_exchange.no_quote_available'),
        explainerType: 'noQuote',
        ...error,
      };
    case 502:
      return {
        buttonLabel: lang.t('button.confirm_exchange.insufficient_liquidity'),
        explainerType: 'insufficientLiquidity',
        ...error,
      };

    default:
      return {
        buttonLabel: lang.t('button.confirm_exchange.no_quote_available'),
        explainerType: 'noQuote',
        ...error,
      };
  }
}
