import React, { Fragment } from 'react';
import { NavigationEvents } from 'react-navigation';
import { statusBar } from '../utils';

const withStatusBarStyle = (statusBarStyle) => (ComponentToWrap) => {
  const ComponentWithStatusBarStyle = (props) => (
    <Fragment>
      <NavigationEvents onDidFocus={() => statusBar.setBarStyle(statusBarStyle, true)} />
      <ComponentToWrap {...props} />
    </Fragment>
  );

  ComponentWithStatusBarStyle.displayName = 'ScreenWithStatusBar';

  return ComponentWithStatusBarStyle;
};

export default withStatusBarStyle;
