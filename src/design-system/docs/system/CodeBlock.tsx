import React from 'react';
// @ts-expect-error
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import useClipboard from 'react-use-clipboard';

import CheckIcon from '../icons/CheckIcon';
import CopyIcon from '../icons/CopyIcon';
import { Button } from '../system';
import codeTheme from '../utils/code-theme';
import { sprinkles } from './sprinkles.css';

export const CodeBlock = ({ code }: { code: string }) => {
  const [isCopied, setCopied] = useClipboard(code, { successDuration: 5000 });
  const isMultipleLines = code.includes('\n');

  return (
    <div
      className={sprinkles({
        backgroundColor: 'bodyDark',
        borderRadius: '16px',
        padding: '24px',
        position: 'relative',
      })}
      style={{ fontSize: '18px', overflowX: 'scroll' }}
    >
      <div
        className={sprinkles({
          // TODO: background provider
          color: 'white',
          position: 'absolute',
          right: '16px',
          ...(isMultipleLines
            ? {
                top: '16px',
              }
            : {}),
        })}
      >
        <Button
          iconBefore={isCopied ? <CheckIcon /> : <CopyIcon />}
          onClick={setCopied}
          size="small"
        >
          {isCopied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
      <SyntaxHighlighter language="tsx" style={codeTheme}>
        {code}
      </SyntaxHighlighter>
    </div>
  );
};
