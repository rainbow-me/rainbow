import React from 'react';
// @ts-expect-error
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

import codeTheme from '../utils/code-theme';
import { sprinkles } from './sprinkles.css';

export const CodeBlock = ({ code }: { code: string }) => {
  return (
    <div
      className={sprinkles({
        backgroundColor: 'bodyDark',
        borderRadius: '16px',
        padding: '24px',
      })}
      style={{ fontSize: '18px', overflowX: 'scroll' }}
    >
      <SyntaxHighlighter language="tsx" style={codeTheme}>
        {code}
      </SyntaxHighlighter>
    </div>
  );
};
