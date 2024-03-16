/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import WebView, { WebViewProps } from 'react-native-webview';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DappBrowserWebview = ({ ...props }: WebViewProps, ref: any) => {
  return <WebView {...props} ref={ref} />;
};

// eslint-disable-next-line import/no-default-export
export default React.forwardRef(DappBrowserWebview);
