import { isNil } from 'lodash';
import { css } from 'styled-components';

export default (values, type) => {
  // Replicating the CSS API, if no second value parameter is given
  // apply the first parameter as both horizontal and vertical values.
  const defaultHorizontal = !isNil(values[1]) ? values[1] : values[0];

  return css`
    ${type}-bottom: ${!isNil(values[2]) ? values[2] : values[0]};
    ${type}-left: ${!isNil(values[3]) ? values[3] : defaultHorizontal};
    ${type}-right: ${defaultHorizontal};
    ${type}-top: ${values[0]};
  `;
};
