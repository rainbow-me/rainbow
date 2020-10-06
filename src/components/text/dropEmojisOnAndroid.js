export default function dropEmojisOnAndroid(text) {
  if (ios) {
    return text;
  }
  if (Array.isArray(text)) {
    return dropEmojisOnAndroid(text.join(' '));
  }

  return text
    ?.replace?.(
      /([\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2694-\u2697]|\uD83E[\uDD10-\uDD5D])/g,
      '__E__'
    )
    .replace(/__E__ /g, ' ')
    .replace(/ __E__/g, ' ')
    .replace(/__E__/g, '')
    .replace(
      /([\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2694-\u2697]|\uD83E[\uDD10-\uDD5D])/g,
      ''
    )
    .trim();
}
