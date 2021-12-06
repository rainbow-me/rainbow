import { isString } from 'lodash';

export default (directionValue = 'right') => {
  const direction = isString(directionValue)
    ? directionValue
    : // @ts-expect-error ts-migrate(2339) FIXME: Property 'direction' does not exist on type 'never... Remove this comment to see the full error message
      directionValue.direction;

  if (direction === 'down') return '90';
  if (direction === 'left') return '180';
  if (direction === 'up') return '270';
  return '0';
};
