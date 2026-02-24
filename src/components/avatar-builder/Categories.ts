import * as i18n from '@/languages';
import { type EmojiCategory } from './types';
import getCategoryIndexAndName from './helpers/getCategoryIndexAndName';

// `name` is used for filtering Emoji, while `getTitle` is used to render the
// title shown to users. Therefore, `name` fields do not use i18n while
// `getTitle` fields do.
export const Categories: Record<string, EmojiCategory> = {
  people: {
    getTitle: () => i18n.t(i18n.l.avatar_builder.emoji_categories.smileys),
    icon: 'emojiSmileys',
    ...getCategoryIndexAndName('Smileys & People'),
    width: 138,
  },
  nature: {
    getTitle: () => i18n.t(i18n.l.avatar_builder.emoji_categories.animals),
    icon: 'emojiAnimals',
    ...getCategoryIndexAndName('Animals & Nature'),
    width: 143,
  },
  food: {
    getTitle: () => i18n.t(i18n.l.avatar_builder.emoji_categories.food),
    icon: 'emojiFood',
    ...getCategoryIndexAndName('Food & Drink'),
    width: 109,
  },
  activities: {
    getTitle: () => i18n.t(i18n.l.avatar_builder.emoji_categories.activities),
    icon: 'emojiActivities',
    ...getCategoryIndexAndName('Activities'),
    width: 87,
  },
  places: {
    getTitle: () => i18n.t(i18n.l.avatar_builder.emoji_categories.travel),
    icon: 'emojiTravel',
    ...getCategoryIndexAndName('Travel & Places'),
    width: 132,
  },
  objects: {
    getTitle: () => i18n.t(i18n.l.avatar_builder.emoji_categories.objects),
    icon: 'emojiObjects',
    ...getCategoryIndexAndName('Objects'),
    width: 75,
  },
  icons: {
    getTitle: () => i18n.t(i18n.l.avatar_builder.emoji_categories.symbols),
    icon: 'emojiSymbols',
    ...getCategoryIndexAndName('Symbols'),
    width: 79,
  },
  flags: {
    getTitle: () => i18n.t(i18n.l.avatar_builder.emoji_categories.flags),
    icon: 'emojiFlags',
    ...getCategoryIndexAndName('Flags'),
    width: 57,
  },
};
