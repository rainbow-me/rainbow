import { mapProps } from 'recompact';
import { calcDirectionToDegrees } from '../styles';
import { reduceArrayToObject } from '../utils';

const withRotationForDirection = Component => mapProps(({ direction, style, ...props }) => {
  const prevStyles = reduceArrayToObject(style);

  return {
    ...props,
    style: reduceArrayToObject([
      prevStyles,
      { transform: [{ rotate: `${calcDirectionToDegrees(direction)}deg` }] },
    ]),
  };
})(Component);

export default withRotationForDirection;
