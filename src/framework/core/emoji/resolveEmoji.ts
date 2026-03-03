import emojis from './emojis.json';

const emojiData = Object.entries(emojis).map(([emojiChar, { name }]) => [name, emojiChar] as const);

const emojiByName = new Map(emojiData);

function normalizeName(name: string): string {
  if (/:.+:/.test(name)) {
    return name.slice(1, -1);
  }
  return name;
}

export function resolveEmoji(name: unknown): string | null {
  if (!name || typeof name !== 'string') return null;
  const result = emojiByName.get(normalizeName(name));
  return result ?? null;
}
