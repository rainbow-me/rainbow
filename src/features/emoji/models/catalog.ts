// Manually maintained name-to-char lookup.
import referenceEmojisByName from '@/references/emojisByName.json';
// Generated from `emoji-datasource` via `yarn generate:emojis`. See scripts/emojis.ts.
import referenceEmojisByCategory from '@/references/emojisByCategory.json';

export type EmojiName = string;
export type EmojisByName = Record<EmojiName, string>;
export type EmojisByCategory = Record<number, string[]>;

export const emojisByName = referenceEmojisByName as EmojisByName;
export const emojisByCategory = referenceEmojisByCategory as EmojisByCategory;
