import React from 'react';
import { NavigationEvents } from 'react-navigation';
import { statusBar } from '../utils';

const withStatusBarStyle = (style) => (InnerComponent) => {
  const Component = (props) => <React.Fragment>
    <NavigationEvents
      onDidFocus={() => statusBar.setBarStyle(style, true)}
    />
    <InnerComponent {...props} />
  </React.Fragment>;
  Component.displayName = 'ScreenWithStatusBar';
  return Component;
};


export default withStatusBarStyle;
