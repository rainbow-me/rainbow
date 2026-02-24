import { describe, expect, test } from '@jest/globals';
import emoji from 'emoji-datasource';
import { Categories } from '../../Categories';
import getFormattedAllEmojiList, {
  type AllEmojiContentEntry,
  type AllEmojiEntry,
  type AllEmojiHeaderEntry,
} from '../getFormattedAllEmojiList';

const categoryKeys = Object.keys(Categories);
const sourceEmojis = emoji.filter(entry => !entry.obsoleted_by);

function getExpectedCategoryEntries(categoryName: string) {
  return sourceEmojis
    .filter(entry => entry.category === categoryName)
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order);
}

function getExpectedSections(categoryKeyList: string[]) {
  return categoryKeyList
    .map(categoryKey => ({
      categoryKey,
      entries: getExpectedCategoryEntries(Categories[categoryKey].name),
    }))
    .filter(section => section.entries.length > 0);
}

function isHeaderEntry(entry: AllEmojiEntry): entry is AllEmojiHeaderEntry {
  return 'header' in entry && entry.header;
}

function isContentEntry(entry: AllEmojiEntry): entry is AllEmojiContentEntry {
  return 'emoji' in entry && entry.emoji;
}

function getSectionContentEntries(allEmojiList: AllEmojiEntry[]) {
  const sections: AllEmojiContentEntry[] = [];

  for (let index = 0; index < allEmojiList.length; index++) {
    const entry = allEmojiList[index];
    const nextEntry = allEmojiList[index + 1];

    if (isHeaderEntry(entry) && nextEntry && isContentEntry(nextEntry)) {
      sections.push(nextEntry);
    }
  }

  return sections;
}

describe('getFormattedAllEmojiList', () => {
  test('returns one emoji section for each category group', () => {
    const allEmojiList = getFormattedAllEmojiList(categoryKeys, 6);
    const sections = getSectionContentEntries(allEmojiList);
    const expectedSections = getExpectedSections(categoryKeys);

    expect(sections).toHaveLength(expectedSections.length);
  });

  test('includes the expected number of emojis in each section', () => {
    const allEmojiList = getFormattedAllEmojiList(categoryKeys, 6);
    const sections = getSectionContentEntries(allEmojiList);
    const expectedSections = getExpectedSections(categoryKeys);

    expectedSections.forEach((expectedSection, sectionIndex) => {
      const actualSectionEmojiCount = sections[sectionIndex]?.data.length;
      const expectedSectionEmojiCount = expectedSection.entries.length;

      expect(actualSectionEmojiCount).toBe(expectedSectionEmojiCount);
    });
  });
});
