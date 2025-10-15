import i18n from '@/languages';
import { EmojiCategory } from './types';

// `name` is used for filtering Emoji, while `getTitle` is used to render the
// title shown to users. Therefore, `name` fields do not use i18n while
// `getTitle` fields do.
export const Categories: Record<string, EmojiCategory> = {
  people: {
    getTitle: () => i18n.avatar_builder.emoji_categories.smileys(),
    icon: 'emojiSmileys',
    index: 0,
    name: 'Smileys & People',
    width: 138,
  },
};
