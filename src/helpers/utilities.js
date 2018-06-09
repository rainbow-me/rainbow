/**
 * @desc ellipse text to max maxLength
 * @param  {String}  [text = '']
 * @param  {Number}  [maxLength = 9999]
 * @return {Intercom}
 */
export const ellipseText = (text = '', maxLength = 9999) => {
  if (text.length <= maxLength) return text;
  const _maxLength = maxLength - 3;
  let ellipse = false;
  let currentLength = 0;
  const result = `${text
    .split(' ')
    .filter(word => {
      currentLength += word.length;
      if (ellipse || currentLength >= _maxLength) {
        ellipse = true;
        return false;
      }
      return true;
    })
    .join(' ')}...`;
  return result;
};

/**
 * @desc ellipse text to max maxLength
 * @param  {String}  [text = '']
 * @param  {Number}  [maxLength = 9999]
 * @return {Intercom}
 */
export const ellipseAddress = (text = '') => {
  const addressArr = text.split('');
  const firstFour = text.split('', 4).join('');
  const lastFour = addressArr
    .reverse()
    .join('')
    .split('', 4)
    .reverse()
    .join('');
  const result = `${firstFour}...${lastFour}`;
  return result;
};

/**
 * @desc capitalize string
 * @param  {String} [string]
 * @return {String}
 */
export const capitalize = string =>
  string
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
