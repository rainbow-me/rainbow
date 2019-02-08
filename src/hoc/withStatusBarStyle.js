import React from 'react';
import { NavigationEvents } from 'react-navigation';
import { statusBar } from '../utils';

// eslint-disable-next-line react/display-name
const withStatusBarStyle = (style) => (InnerComponent) => (props) => <React.Fragment>
  <NavigationEvents
    onDidFocus={() => statusBar.setBarStyle(style, true)}
  />
  <InnerComponent {...props} />
</React.Fragment>;

export default withStatusBarStyle;
