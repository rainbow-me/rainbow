import Document, {
  DocumentContext,
  Head,
  Html,
  Main,
  NextScript,
} from 'next/document';
import * as React from 'react';

import { InitColorModeScript } from '../system/ColorMode';

// @ts-expect-error TypeScript doesn't like us treating 'Document' as a class because the type says it's a plain function, but this is what the docs says to do: https://nextjs.org/docs/advanced-features/custom-document
class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    // @ts-expect-error 'getInitialProps' is missing on the type definition for 'Document', but it works and it's in the docs: https://nextjs.org/docs/advanced-features/custom-document
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
