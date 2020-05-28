import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import styled from 'styled-components/primitives';
import { padding } from '../../styles';
import { Row } from '../layout';

const StatusBarHeight = getStatusBarHeight(true);
export const HeaderHeight = 44;
export const HeaderHeightWithStatusBar = HeaderHeight + StatusBarHeight;

const Header = styled(Row).attrs({ align: 'end' })`
  ${padding(StatusBarHeight, 0, 0)};
  height: ${HeaderHeightWithStatusBar};
  width: 100%;
  z-index: 1;
`;

export default Header;
