import React from 'react';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import { padding } from '../../styles';
import { Row } from '../layout';

const StatusBarHeight = getStatusBarHeight(true);
const HeaderHeight = 52;
const HeaderHeightWithStatusBar = HeaderHeight + StatusBarHeight;

const Header = React.memo((props) => (
  <Row
    {...props}
    align="end"
    css={padding(StatusBarHeight, 9, 0)}
    flexShrink={0}
    height={HeaderHeightWithStatusBar}
    width="100%"
    zIndex={1}
  />
));

Header.height = HeaderHeight;

export default Header;
