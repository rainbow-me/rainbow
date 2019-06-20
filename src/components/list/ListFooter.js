import styled from 'styled-components/primitives';
import { withNeverRerender } from '../../hoc';
import { colors } from '../../styles';

const ListFooterHeight = 27;

const Spacer = styled.View`
  background-color: ${colors.white};
  height: ${ListFooterHeight};
  width: 100%;
`;

const ListFooter = withNeverRerender(Spacer);

ListFooter.height = ListFooterHeight;

export default ListFooter;
