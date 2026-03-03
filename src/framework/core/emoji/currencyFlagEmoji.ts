import { emojisByName } from './emojisByName';

export function resolveCurrencyFlagEmoji(emojiName?: string): string {
  if (!emojiName) return '';
  return emojisByName[`flag_${emojiName}`] ?? '';
}
