import { mapProps } from 'recompact';
import { calcDirectionToDegrees } from '../styles';
import { reduceStylesArrayToObject } from '../utils';

const withRotationForDirection = Component => mapProps(({ direction, style, ...props }) => {
  const prevStyles = reduceStylesArrayToObject(style);

  return {
    ...props,
    style: reduceStylesArrayToObject([
      prevStyles,
      { transform: [{ rotate: `${calcDirectionToDegrees(direction)}deg` }] },
    ]),
  };
})(Component);

export default withRotationForDirection;
