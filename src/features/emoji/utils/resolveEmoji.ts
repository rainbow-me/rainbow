import { isString } from 'lodash';
import { emojisByName } from '@/features/emoji/models/catalog';

function normalizeName(name: string): string {
  if (/:.+:/.test(name)) {
    return name.slice(1, -1);
  }
  return name;
}

export function resolveEmoji(name: unknown): string | null {
  if (!isString(name)) return null;
  const result = emojisByName[normalizeName(name)];
  return result ?? null;
}
