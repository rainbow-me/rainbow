// Generated from `emoji-datasource` via `yarn generate:emojis`. See scripts/emojis.ts.
import referenceEmojisByCategory from './references/emojisByCategory.json';

export type EmojisByCategory = Record<number, string[]>;

export const emojisByCategory = referenceEmojisByCategory as EmojisByCategory;
