import { Dimensions } from 'react-native';
import { Categories } from '../Categories';
import { EMOJIS_CONTAINER_HORIZONTAL_MARGIN, EMOJIS_TOP_OFFSET } from '../constants';
import { type EmojiEntry } from '../types';
import { emojisByCategory } from '@/features/emoji/models/catalog';

const { width } = Dimensions.get('screen');

export interface SingleEmojiEntry {
  key: string;
  emoji: EmojiEntry;
}

export interface AllEmojiOverlayEntry {
  overlay: true;
}

export interface AllEmojiHeaderEntry {
  header: true;
  title: string;
}

export type AllEmojiContentEntry = {
  emoji: true;
  data: SingleEmojiEntry[];
  height?: number;
  offset?: number;
};

export type AllEmojiSectionEntry = [AllEmojiHeaderEntry, AllEmojiContentEntry];

export type AllEmojiEntry = AllEmojiOverlayEntry | AllEmojiHeaderEntry | AllEmojiContentEntry;

export default function getFormattedAllEmojiList(keys: string[], columnsCount: number) {
  let allEmojiList: AllEmojiEntry[] = [{ overlay: true }];
  let offset = 0;

  keys.forEach(category => {
    const categoryId = Categories[category].index;
    const categoryEmojis = emojisByCategory[categoryId] ?? [];

    const emojiSection: AllEmojiSectionEntry = [
      { header: true, title: Categories[category].getTitle() },
      {
        data: categoryEmojis.map((char, index) => ({
          emoji: { categoryId, char } satisfies EmojiEntry,
          key: `${categoryId}-${char}`,
        })),
        emoji: true,
      },
    ];

    if (emojiSection[1].data.length > 0) {
      const height =
        Math.floor(emojiSection[1].data.length / columnsCount + 1) * ((width - 2 * EMOJIS_CONTAINER_HORIZONTAL_MARGIN) / columnsCount);
      emojiSection[1].height = height;
      offset += height + EMOJIS_TOP_OFFSET;
      emojiSection[1].offset = offset;
      allEmojiList = allEmojiList.concat(emojiSection);
    }
  });

  allEmojiList.push({ overlay: true });

  return allEmojiList;
}
