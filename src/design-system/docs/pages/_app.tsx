import '../styles/fonts.css';
import '../styles/globals.css';
import '../shims';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import React from 'react';

function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Rainbow Design System Cheat Sheet</title>
        <link href="/favicon.ico" rel="icon" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default App;
