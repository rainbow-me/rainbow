import { emojis } from '@/references';

const emojiData = Object.entries(emojis).map(([emojiChar, { name }]) => [name, emojiChar] as const);

const emojiByName = new Map(emojiData);

export function resolveCurrencyFlagEmoji(emojiName?: string): string {
  if (!emojiName) return '';
  return emojiByName.get(`flag_${emojiName}`) ?? '';
}
