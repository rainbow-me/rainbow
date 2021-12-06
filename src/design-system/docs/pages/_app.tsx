import '../styles/globals.css';
import type { AppProps } from 'next/app';
import React from 'react';

function App({ Component, pageProps }: AppProps) {
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  return <Component {...pageProps} />;
}

export default App;
