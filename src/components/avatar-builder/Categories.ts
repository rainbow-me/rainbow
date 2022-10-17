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
  nature: {
    getTitle: () => lang.t('avatar_builder.emoji_categories.animals'),
    icon: 'emojiAnimals',
    index: 1,
    name: 'Animals & Nature',
    width: 143,
  },
  food: {
    getTitle: () => lang.t('avatar_builder.emoji_categories.food'),
    icon: 'emojiFood',
    index: 2,
    name: 'Food & Drink',
    width: 109,
  },
  activities: {
    getTitle: () => lang.t('avatar_builder.emoji_categories.activities'),
    icon: 'emojiActivities',
    index: 3,
    name: 'Activities',
    width: 87,
  },
  places: {
    getTitle: () => lang.t('avatar_builder.emoji_categories.travel'),
    icon: 'emojiTravel',
    index: 4,
    name: 'Travel & Places',
    width: 132,
  },
  objects: {
    getTitle: () => lang.t('avatar_builder.emoji_categories.objects'),
    icon: 'emojiObjects',
    index: 5,
    name: 'Objects',
    width: 75,
  },
  icons: {
    getTitle: () => lang.t('avatar_builder.emoji_categories.symbols'),
    icon: 'emojiSymbols',
    index: 6,
    name: 'Symbols',
    width: 79,
  },
  flags: {
    getTitle: () => lang.t('avatar_builder.emoji_categories.flags'),
    icon: 'emojiFlags',
    index: 7,
    name: 'Flags',
    width: 57,
  },
};
