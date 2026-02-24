import { CATEGORY_ID_BY_CATEGORY_NAME } from '@/features/emoji/constants';

type EmojiCategoryName = keyof typeof CATEGORY_ID_BY_CATEGORY_NAME;

export default function getCategoryIndexAndName(name: EmojiCategoryName) {
  return {
    index: CATEGORY_ID_BY_CATEGORY_NAME[name],
    name,
  };
}
