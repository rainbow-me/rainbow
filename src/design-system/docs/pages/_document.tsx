import Document, { DocumentContext, Head, Html, Main, NextScript } from 'next/document';
import * as React from 'react';

import { InitColorModeScript } from '../system/ColorMode';

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html>
        <Head />
        <body>
          <Main />
          <NextScript />
          <InitColorModeScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
