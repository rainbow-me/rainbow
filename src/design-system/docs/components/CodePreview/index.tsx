import lzString from 'lz-string';
import React from 'react';

import { useSourceFromExample } from '../../hooks/useSourceFromExample';
import { CodeBlock, Inline, Stack, Text } from '../../system';
import { sprinkles } from '../../system/sprinkles.css';
import { Source } from '../../utils/source.macro';

export const CodePreview = ({
  disableActions = false,
  enableCodeSnippet = true,
  enablePlayroom = true,
  showCode: defaultShowCode = false,
  showFrame = false,
  Example,
}: {
  disableActions?: boolean;
  enableCodeSnippet?: boolean;
  showCode?: boolean;
  enablePlayroom?: boolean;
  showFrame?: boolean;
  Example: () => Source<React.ReactChild>;
}) => {
  const [showCode, setShowCode] = React.useState(Boolean(defaultShowCode));
  const { displayCode, playroomCode, element } = useSourceFromExample({
    Example,
  });

  return (
    <Stack space="16px">
      <div
        className={sprinkles({
          borderRadius: '16px',
          padding: '24px',
        })}
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
        }}
      >
        <div
          className={sprinkles({
            borderRadius: '16px',
          })}
          style={
            showFrame ? { backgroundColor: 'rgba(255, 255, 255, 0.5)' } : {}
          }
        >
          {element}
        </div>
      </div>
      {displayCode && (
        <>
          {showCode && <CodeBlock code={displayCode} />}
          {!disableActions && (
            <Inline alignHorizontal="right" space="24px">
              {enablePlayroom && (
                <a
                  href={`${
                    process.env.NODE_ENV === 'production'
                      ? // @ts-ignore
                        `${window.location.href}playroom`
                      : 'http://localhost:9000/'
                  }?code=${lzString.compressToEncodedURIComponent(
                    JSON.stringify({ code: playroomCode })
                  )}`}
                  rel="noreferrer"
                  style={{ textAlign: 'right' }}
                  target="_blank"
                >
                  <Text color="action" weight="bold">
                    Playroom
                  </Text>
                </a>
              )}
              {enableCodeSnippet && (
                <button
                  onClick={() => setShowCode(showCode => !showCode)}
                  style={{ textAlign: 'right' }}
                  type="button"
                >
                  <Text color="action" weight="bold">
                    {showCode ? 'Hide' : 'Show'} code
                  </Text>
                </button>
              )}
            </Inline>
          )}
        </>
      )}
    </Stack>
  );
};
