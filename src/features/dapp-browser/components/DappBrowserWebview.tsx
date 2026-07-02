/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';

import WebView, { type WebViewProps } from 'react-native-webview';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DappBrowserWebviewComponent = ({ ...props }: WebViewProps, ref: any) => {
  return <WebView {...props} ref={ref} />;
};

export const DappBrowserWebview = React.forwardRef(DappBrowserWebviewComponent);
