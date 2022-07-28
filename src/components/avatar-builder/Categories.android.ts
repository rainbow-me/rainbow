import lang from 'i18n-js';
import { EmojiCategory } from './types';

// `name` is used for filtering Emoji, while `getTitle` is used to render the
// title shown to users. Therefore, `name` fields do not use i18n while
// `getTitle` fields do.
export const Categories: Record<string, EmojiCategory> = {
  people: {
    getTitle: () => lang.t('avatar_builder.emoji_categories.smileys'),
    icon: 'emojiSmileys',
    index: 0,
    name: 'Smileys & People',
    width: 138,
  },
};
