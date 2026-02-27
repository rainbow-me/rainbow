import { isString } from 'lodash';
import { emojis } from '@/references';

const emojiData = Object.entries(emojis).map(([emojiChar, { name }]) => [name, emojiChar] as const);

const emojiByName = new Map(emojiData);

function normalizeName(name: string): string {
  if (/:.+:/.test(name)) {
    return name.slice(1, -1);
  }
  return name;
}

export function resolveEmoji(name: unknown): string | null {
  if (!isString(name)) return null;
  const result = emojiByName.get(normalizeName(name));
  return result ?? null;
}
