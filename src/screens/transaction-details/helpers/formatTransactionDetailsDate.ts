import { getDateFnsLocale } from '@/languages';
import format from 'date-fns/format';

export function formatTransactionDetailsDate(minedAtInSeconds?: number): string | undefined {
  if (!minedAtInSeconds) {
    return;
  }
  const isLikelyInSeconds = minedAtInSeconds < 10_000_000_000;
  const timestampInMs = isLikelyInSeconds ? minedAtInSeconds * 1000 : minedAtInSeconds;

  const date = new Date(timestampInMs);

  const formatted = format(date, "MMM d, yyyy 'at' h:mm a", {
    locale: getDateFnsLocale(),
  });
  return formatted;
}
