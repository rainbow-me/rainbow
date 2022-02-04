import lang from 'i18n-js';

// `name` is used for filtering Emoji, while `getTitle` is used to render the
// title shown to users. Therefore, `name` fields do not use i18n while
// `getTitle` fields do.
export const Categories = {
  people: {
    getTitle: () => lang.t('avatar_builder.emoji_categories.smileys'),
    icon: 'emojiSmileys',
    index: 0,
    name: 'Smileys & People',
    width: 138,
  },
};
