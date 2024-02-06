import React from 'react';
// @ts-expect-error
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import useClipboard from 'react-use-clipboard';

import CheckIcon from '../icons/CheckIcon';
import CopyIcon from '../icons/CopyIcon';
import { Button } from '../system';
import codeTheme from '../utils/code-theme';
import { useColorMode } from './ColorMode';
import { dark } from './colorModes.css';
import { sprinkles } from './sprinkles.css';

export const CodeBlock = ({ code }: { code: string }) => {
  const { colorMode } = useColorMode();
  const [isCopied, setCopied] = useClipboard(code, { successDuration: 5000 });
  const isMultipleLines = code.includes('\n');

  return (
    <div className={colorMode === 'light' ? dark : ''}>
      <div
        className={sprinkles({
          backgroundColor: colorMode === 'light' ? 'body (Deprecated)' : 'bodyTint (Deprecated)',
          borderRadius: '16px',
          padding: '24px',
          position: 'relative',
        })}
        style={{ fontSize: '18px', overflowX: 'scroll' }}
      >
        <div
          className={sprinkles({
            color: 'primary (Deprecated)',
            position: 'absolute',
            right: '16px',
            ...(isMultipleLines
              ? {
                  top: '16px',
                }
              : {}),
          })}
        >
          <Button iconBefore={isCopied ? <CheckIcon /> : <CopyIcon />} onClick={setCopied} size="small">
            {isCopied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
        <SyntaxHighlighter language="tsx" style={codeTheme}>
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};
