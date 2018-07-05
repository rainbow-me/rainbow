import { css } from 'styled-components';

const position = {};

position.size = size => css`
  height: ${size};
  width: ${size};
`;

position.sizeAsObject = size => ({
  height: size,
  width: size,
});

export default position;
