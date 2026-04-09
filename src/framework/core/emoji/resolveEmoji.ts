import { isString } from 'lodash';

import { emojisByName } from './emojisByName';

function normalizeName(name: string): string {
  if (/:.+:/.test(name)) {
    return name.slice(1, -1);
  }
  return name;
}

export function resolveEmoji(name: unknown): string | null {
  if (!isString(name)) return null;
  return emojisByName[normalizeName(name)] ?? null;
}
