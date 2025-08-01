import GraphemeSplitter from 'grapheme-splitter';
import { memoFn } from '../utils/memoFn';

const regex =
  /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;

export { GraphemeSplitter };

export const getValidatedEmoji = memoFn((string: string) => {
  if (!string) return null;
  const graphemes = new GraphemeSplitter().splitGraphemes(string);
  if (graphemes.length !== 1) return null;
  const emoji = graphemes[0];
  return emoji.search(regex) > -1 ? emoji : null;
});

export const removeFirstEmojiFromString = memoFn(string => {
  if (!string) return '';

  // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'unknown' is not assignable to pa... Remove this comment to see the full error message
  const grapheme = new GraphemeSplitter().splitGraphemes(string);
  const first = grapheme[0];

  if (first.search(regex) > -1) {
    grapheme.splice(0, 2);
  }
  return grapheme?.join('');
});

export const returnStringFirstEmoji = memoFn(string => {
  if (!string) return false;

  // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'unknown' is not assignable to pa... Remove this comment to see the full error message
  const grapheme = new GraphemeSplitter().splitGraphemes(string);
  const first = grapheme[0];

  if (first.search(regex) > -1) {
    return first;
  }
  return false;
});

export const getFirstEmoji = memoFn((string: string) => {
  if (!string) return false;
  const first = new GraphemeSplitter().splitGraphemes(string)[0];
  if (first.search(regex) > -1) {
    return first;
  }
  return false;
});
