import { isString } from 'lodash';

export default (directionValue = 'right') => {
  const direction = isString(directionValue)
    ? directionValue
    : directionValue.direction;

  if (direction === 'down') return '90';
  else if (direction === 'left') return '180';
  else if (direction === 'up') return '270';
  return '0';
};
