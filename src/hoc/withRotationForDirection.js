import { mapProps } from 'recompact';
import { reduceArrayToObject } from '../utils';
import { calcDirectionToDegrees } from '@rainbow-me/styles';

const withRotationForDirection = Component =>
  mapProps(({ direction, style, ...props }) => {
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
