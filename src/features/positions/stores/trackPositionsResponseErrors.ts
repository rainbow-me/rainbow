import { analytics } from '@/analytics';
import { type EventProperties } from '@/analytics/event';

type ParsedPositionsError = EventProperties[typeof analytics.event.positionsError];

const PRICE_NOT_FOUND_REGEX = /^price not found for key: (.+):(\d+)/;
const SKIPPED_PORTFOLIO_ITEM_REGEX = /^skipped portfolio item '([^']+)' for protocol (\S+)/;

function paraseErrorMessage(errorMessage: string): ParsedPositionsError {
  const priceMatch = errorMessage.match(PRICE_NOT_FOUND_REGEX);
  if (priceMatch) {
    const [, tokenAddress, chainId] = priceMatch;
    return { kind: 'price_not_found', tokenAddress: tokenAddress.toLowerCase(), chainId: Number(chainId) };
  }

  const skippedMatch = errorMessage.match(SKIPPED_PORTFOLIO_ITEM_REGEX);
  if (skippedMatch) {
    const [, itemName, protocol] = skippedMatch;
    return { kind: 'skipped_portfolio_item', itemName, protocol };
  }

  return { kind: 'unknown', errorMessage };
}

function getParsedErrorKey(error: ParsedPositionsError): string {
  switch (error.kind) {
    case 'price_not_found':
      return `price:${error.tokenAddress}:${error.chainId}`;
    case 'skipped_portfolio_item':
      return `skipped:${error.protocol}:${error.itemName}`;
    case 'unknown':
      return `unknown:${error.errorMessage}`;
  }
}

export function trackPositionsResponseErrors(errorMessages: string[]): void {
  const seenErrors = new Set<string>();
  for (const errorMessage of errorMessages) {
    const parsedError = paraseErrorMessage(errorMessage);
    const errorMessageKey = getParsedErrorKey(parsedError);
    if (seenErrors.has(errorMessageKey)) continue;
    seenErrors.add(errorMessageKey);
    analytics.track(analytics.event.positionsError, parsedError);
  }
}
