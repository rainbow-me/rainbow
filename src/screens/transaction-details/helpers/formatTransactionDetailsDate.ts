import { getDateFnsLocale } from '@/languages';
import format from 'date-fns/format';

export function formatTransactionDetailsDate(
  minedAtInSeconds?: number
): string | undefined {
  if (!minedAtInSeconds) {
    return;
  }
  const timestampInMs = new Date(minedAtInSeconds * 1000);

  const formatted = format(timestampInMs, "MMM d, yyyy 'at' h:mm a", {
    locale: getDateFnsLocale(),
  });
  return formatted;
}
