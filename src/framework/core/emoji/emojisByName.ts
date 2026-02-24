// Manually maintained name-to-char lookup.
import referenceEmojisByName from './references/emojisByName.json';

export type EmojiName = string;
export type EmojisByName = Record<EmojiName, string>;

export const emojisByName = referenceEmojisByName as EmojisByName;
