import styled from 'styled-components/primitives';
import { colors, position } from '../../styles';
import PrimitiveWithoutOmittedProps from './PrimitiveWithoutOmittedProps';

const InnerBorder = styled(PrimitiveWithoutOmittedProps).attrs({
  blacklist: 'width',
  pointerEvents: 'none',
})`
  ${position.cover};
  border-color: ${({ color }) => color || colors.black};
  border-radius: ${({ radius }) => radius || 0};
  border-width: ${({ width }) => width || 0.5};
  opacity: ${({ opacity }) => opacity || 0.06};
`;

export default InnerBorder;
