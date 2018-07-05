// import { upperFirst } from 'lodash';
import { css } from 'styled-components';
import colors from './colors';

const border = {};

border.color = colors.lightGrey;
border.radius = 6;
border.width = 1;

border.default = css`
  border-color: ${border.color};
  border-width: ${border.width};
`;

// border.buildRadius = (direction, value = border.radius) => {
//   if (direction === 'bottom' || direction === 'top') {
//     return {
//       [`border${upperFirst(direction)}LeftRadius`]: value,
//       [`border${upperFirst(direction)}RightRadius`]: value,
//     };
//   } else if (direction === 'left' || direction === 'right') {
//     return {
//       [`borderBottom${upperFirst(direction)}Radius`]: value,
//       [`borderTop${upperFirst(direction)}Radius`]: value,
//     };
//   }

//   return {
//     borderTopLeftRadius: value,
//     borderTopRightRadius: value,
//     borderBottomLeftRadius: value,
//     borderBottomRightRadius: value,
//   };
// };

export default border;
