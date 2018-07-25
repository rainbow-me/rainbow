import { css } from 'styled-components';

const position = {};

position.absCenter = css`
  left: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
`;

position.absCenterHorizontal = css`
  left: 50%;
  position: absolute;
  transform: translateX(-50%);
`;

position.absCenterVertical = css`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
`;

position.cover = css`
  bottom: 0;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
`;

position.coverAsObject = {
  bottom: 0,
  left: 0,
  position: 'absolute',
  right: 0,
  top: 0,
};

position.size = (size, prefix = '') => css`
  ${prefix}${prefix ? 'H' : 'h'}eight: ${size};
  ${prefix}${prefix ? 'W' : 'w'}idth:  ${size};
`;

position.sizeAsObject = size => ({
  height: size,
  width: size,
});

position.maxSize = size => position.size(size, 'max');
position.minSize = size => position.size(size, 'min');

export default position;
