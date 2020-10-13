/**
 * @desc subtracts two numbers
 * @param  {String}   str
 * @param  {Number}   numberTwo
 * @return {String}
 */
export function containsEmoji(str) {
  const ranges = [
    '(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])',
  ];
  return !!str.match(ranges.join('|'));
}
