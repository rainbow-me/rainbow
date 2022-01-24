import lang from 'i18n-js';

/* eslint-disable sort-keys-fix/sort-keys-fix */

// `name` is used for filtering Emoji, while `getTitle` is used to render the
// title shown to users. Therefore, `name` fields do not use i18n while
// `getTitle` fields do.
export const Categories = {
  people: {
    icon: 'emojiSmileys',
    index: 0,
    name: 'Smileys & People',
    getTitle: () => lang.t('avatar_builder.emoji_categories.smileys'),
    width: 138,
  },
  nature: {
    icon: 'emojiAnimals',
    index: 1,
    name: 'Animals & Nature',
    getTitle: () => lang.t('avatar_builder.emoji_categories.animals'),
    width: 143,
  },
  food: {
    icon: 'emojiFood',
    index: 2,
    name: 'Food & Drink',
    getTitle: () => lang.t('avatar_builder.emoji_categories.food'),
    width: 109,
  },
  activities: {
    icon: 'emojiActivities',
    index: 3,
    name: 'Activities',
    getTitle: () => lang.t('avatar_builder.emoji_categories.activities'),
    width: 87,
  },
  places: {
    icon: 'emojiTravel',
    index: 4,
    name: 'Travel & Places',
    getTitle: () => lang.t('avatar_builder.emoji_categories.travel'),
    width: 132,
  },
  objects: {
    icon: 'emojiObjects',
    index: 5,
    name: 'Objects',
    getTitle: () => lang.t('avatar_builder.emoji_categories.objects'),
    width: 75,
  },
  icons: {
    icon: 'emojiSymbols',
    index: 6,
    name: 'Symbols',
    getTitle: () => lang.t('avatar_builder.emoji_categories.symbols'),
    width: 79,
  },
  flags: {
    icon: 'emojiFlags',
    index: 7,
    name: 'Flags',
    getTitle: () => lang.t('avatar_builder.emoji_categories.flags'),
    width: 57,
  },
};

/* eslint-enable sort-keys-fix/sort-keys-fix */
