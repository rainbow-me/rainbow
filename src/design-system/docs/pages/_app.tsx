import '../styles/fonts.css';
import '../system/globals.css';
import '../shims';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import React from 'react';

import { ColorModeProvider as NativeColorModeProvider } from '../../color/ColorMode';
import { ColorModeProvider, ColorModeToggle } from '../system/ColorMode';
import { sprinkles } from '../system/sprinkles.css';

function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Rainbow Design System Cheat Sheet</title>
        <link href="/favicon.ico" rel="icon" />
      </Head>
      <ColorModeProvider>
        {colorMode => (
          <NativeColorModeProvider value={colorMode}>
            <div className={sprinkles({ visibility: { collapsed: 'hidden' } })}>
              <ColorModeToggle />
            </div>
            <Component {...pageProps} />
          </NativeColorModeProvider>
        )}
      </ColorModeProvider>
    </>
  );
}

export default App;
