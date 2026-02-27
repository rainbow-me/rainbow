import { emojisByName } from '@/features/emoji/models/catalog';

export function resolveCurrencyFlagEmoji(emojiName?: string): string {
  if (!emojiName) return '';
  return emojisByName[`flag_${emojiName}`] ?? '';
}
