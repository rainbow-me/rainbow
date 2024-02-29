import { memoFn } from '../utils/memoFn';
/**
 * @desc subtracts two numbers
 * @param  {String}   str
 * @param  {Number}   numberTwo
 * @return {String}
 */
export const containsEmoji = memoFn(str => {
  const ranges = ['(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])'];
  // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
  return !!str.match(ranges.join('|'));
});
