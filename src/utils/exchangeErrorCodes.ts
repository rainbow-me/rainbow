import { QuoteError } from '@rainbow-me/swaps';
import lang from 'i18n-js';

export interface ExchangeQuoteError extends QuoteError {
  buttonLabel: string;
  explainerType: string;
}

export default function handleSwapErrorCodes(quoteError: QuoteError): ExchangeQuoteError {
  const { error_code: errorCode } = quoteError;
  switch (errorCode) {
    case 501:
      return {
        buttonLabel: lang.t('button.confirm_exchange.no_quote_available'),
        explainerType: 'noQuote',
        ...quoteError,
      };
    case 502:
      return {
        buttonLabel: lang.t('button.confirm_exchange.insufficient_liquidity'),
        explainerType: 'insufficientLiquidity',
        ...quoteError,
      };

    case 503: {
      return {
        buttonLabel: lang.t('button.confirm_exchange.fee_on_transfer'),
        explainerType: 'feeOnTransfer',
        ...quoteError,
      };
    }

    case 504:
      return {
        buttonLabel: lang.t('button.confirm_exchange.no_route_found'),
        explainerType: 'noRouteFound',
        ...quoteError,
      };

    default:
      return {
        buttonLabel: lang.t('button.confirm_exchange.no_quote_available'),
        explainerType: 'noQuote',
        ...quoteError,
      };
  }
}
