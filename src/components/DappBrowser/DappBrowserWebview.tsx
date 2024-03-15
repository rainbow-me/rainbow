/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import WebView, { WebViewProps } from 'react-native-webview';

const DappBrowserWebview = (props: WebViewProps) => {
  return <WebView {...props} sandbox={false} />;
};

// eslint-disable-next-line import/no-default-export
export default React.forwardRef(DappBrowserWebview);
