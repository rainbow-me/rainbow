// This script generates avatar picker emoji data from `emoji-datasource`
// and writes it to `src/references/emojisByCategory.json`.
//
// Run with:
//   yarn generate:emojis

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import emojiDatasource from 'emoji-datasource';
import { CATEGORY_ID_BY_CATEGORY_NAME } from '../src/features/emoji/constants';

type CategoryName = keyof typeof CATEGORY_ID_BY_CATEGORY_NAME;

interface EmojiDatasourceEntry {
  unified?: string;
  category?: string;
  sort_order?: number;
  obsoleted_by?: string | null;
}

interface EmojiForAvatar {
  char: string;
  sortOrder: number;
}

type AvatarEmojiMap = Record<number, string[]>;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.resolve(__dirname, '../src/references/emojisByCategory.json');

function charFromUnified(unified: string): string {
  const codePoints = unified.split('-').map(code => Number.parseInt(code, 16));
  return String.fromCodePoint(...codePoints);
}

function createEmptyAvatarEmojiMap(): AvatarEmojiMap {
  return Object.values(CATEGORY_ID_BY_CATEGORY_NAME).reduce<AvatarEmojiMap>((acc, categoryId) => {
    acc[categoryId] = [];
    return acc;
  }, {});
}

function generateAvatarEmojis() {
  const emojisByCategory = Object.values(CATEGORY_ID_BY_CATEGORY_NAME).reduce<Record<number, EmojiForAvatar[]>>((acc, categoryId) => {
    acc[categoryId] = [];
    return acc;
  }, {});

  for (const entry of emojiDatasource as EmojiDatasourceEntry[]) {
    if (!entry.unified || entry.obsoleted_by || !entry.category || typeof entry.sort_order !== 'number') {
      continue;
    }

    const categoryId = CATEGORY_ID_BY_CATEGORY_NAME[entry.category as CategoryName];
    if (categoryId === undefined) {
      continue;
    }

    emojisByCategory[categoryId].push({
      char: charFromUnified(entry.unified),
      sortOrder: entry.sort_order,
    });
  }

  const avatarEmojisByCategory = createEmptyAvatarEmojiMap();

  for (const [categoryId, emojis] of Object.entries(emojisByCategory)) {
    avatarEmojisByCategory[Number(categoryId)] = emojis.sort((a, b) => a.sortOrder - b.sortOrder).map(emoji => emoji.char);
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(avatarEmojisByCategory));

  console.log(`Generated ${OUTPUT_PATH}`);
}

generateAvatarEmojis();
